/** @format */

import type { Request, Response } from "express";
import db from "../config/database.js";
import { default as dayjs } from "dayjs";
import {
  getSystemSettings,
  determineAttendanceStatus,
} from "../utils/systemSettings.js";
import { SCHOOL_LOCATION, getDistanceInMeters } from "../utils/geolocation.js";

const computeDistance = (desc1: number[], desc2: number[]) => {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) {
    throw new Error("Descriptor arrays harus ada dan punya panjang sama");
  }

  return Math.sqrt(
    desc1.reduce((acc, val, i) => {
      const other = desc2[i] ?? 0;
      return acc + Math.pow(val - other, 2);
    }, 0),
  );
};

const getTeacherByUserId = async (userId: number) => {
  const [teacherRows]: any = await db.execute(
    "SELECT id FROM teachers WHERE user_id = ?",
    [userId],
  );
  return teacherRows[0];
};

export const getTeacherProfile = async (req: any, res: Response) => {
  const userId = req.user.id;

  try {
    const [rows]: any = await db.execute(
      `SELECT u.id, u.full_name,
              t.nip
       FROM users u
       LEFT JOIN teachers t ON u.id = t.user_id
       WHERE u.id = ?`,
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }

    const teacher = rows[0];
    res.json({
      id: teacher.id,
      fullName: teacher.full_name,
      nip: teacher.nip || "-",
    });
  } catch (error) {
    console.error("Error getting teacher profile:", error);
    res.status(500).json({ message: "Gagal mengambil data profil guru" });
  }
};

export const getDashboardStats = async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const [teachers]: any = await db.execute(
      "SELECT id FROM teachers WHERE user_id = ?",
      [userId],
    );

    if (teachers.length === 0) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }

    const teacherId = teachers[0].id;
    const today = new Date().toISOString().slice(0, 10);
    const dayName = dayjs().format("dddd");
    const dayNameIndonesia = dayjs().locale("id").format("dddd");

    const [classRows]: any = await db.execute(
      "SELECT COUNT(*) as count FROM classes WHERE homeroom_teacher_id = ?",
      [teacherId],
    );
    const classCount = classRows[0]?.count || 0;

    const [studentRows]: any = await db.execute(
      `SELECT COUNT(s.id) as count FROM students s
       INNER JOIN classes c ON s.class_id = c.id
       WHERE c.homeroom_teacher_id = ?`,
      [teacherId],
    );
    const totalStudents = studentRows[0]?.count || 0;

    const [presentRows]: any = await db.execute(
      `SELECT COUNT(DISTINCT a.user_id) as count 
       FROM attendance a
       INNER JOIN students s ON a.user_id = s.user_id
       INNER JOIN classes c ON s.class_id = c.id
       WHERE a.date = ? AND a.status IN ('Hadir', 'Terlambat') AND c.homeroom_teacher_id = ?`,
      [today, teacherId],
    );
    const presentToday = presentRows[0]?.count || 0;

    const [todaySchedule]: any = await db.execute(
      `SELECT 
        sch.id,
        sch.start_time,
        sch.end_time,
        sch.subject,
        sch.room,
        c.class_name,
        TIME_FORMAT(sch.start_time, '%H:%i') as time
       FROM schedules sch
       INNER JOIN classes c ON sch.class_id = c.id
       WHERE sch.teacher_id = ? AND sch.day = ?
       ORDER BY sch.start_time ASC`,
      [teacherId, dayNameIndonesia],
    );

    const [announcementRows]: any = await db.execute(
      "SELECT COUNT(*) as count FROM announcements WHERE teacher_id = ?",
      [teacherId],
    );
    const announcementCount = announcementRows[0]?.count || 0;

    const sevenDaysAgo = dayjs().subtract(7, "days").format("YYYY-MM-DD");
    const [trendRows]: any = await db.execute(
      `SELECT 
        DATE_FORMAT(a.date, '%d/%m') as date,
        COUNT(DISTINCT a.user_id) as present_count
       FROM attendance a
       INNER JOIN students s ON a.user_id = s.user_id
       INNER JOIN classes c ON s.class_id = c.id
       WHERE a.date >= ? AND a.status IN ('Hadir', 'Terlambat') AND c.homeroom_teacher_id = ?
       GROUP BY DATE(a.date)
       ORDER BY a.date ASC`,
      [sevenDaysAgo, teacherId],
    );

    const attendanceTrend = trendRows.map((row: any) => ({
      date: row.date,
      rate:
        totalStudents > 0
          ? Math.round((row.present_count / totalStudents) * 100)
          : 0,
    }));

    res.json({
      classCount,
      totalStudents,
      presentToday,
      attendanceRate:
        totalStudents > 0
          ? Math.round((presentToday / totalStudents) * 100)
          : 0,
      announcementCount,
      todaySchedule,
      attendanceTrend,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Gagal mengambil data dashboard" });
  }
};

export const createAnnouncement = async (req: any, res: any) => {
  const { title, content, target_class_id } = req.body;
  const userId = req.user.id;

  try {
    const teacher = await getTeacherByUserId(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }

    const teacherId = teacher.id;
    await db.execute(
      "INSERT INTO announcements (title, content, teacher_id, class_id) VALUES (?, ?, ?, ?)",
      [title, content, teacherId, target_class_id],
    );
    res.json({ message: "Pengumuman berhasil disebarkan" });
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error creating announcement:", err.message);
    } else {
      console.error("Unexpected error:", err);
    }
    res.status(500).json({ message: "Gagal membuat pengumuman" });
  }
};

export const getAnnouncements = async (req: any, res: any) => {
  const userId = req.user.id;

  try {
    const teacher = await getTeacherByUserId(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }

    const teacherId = teacher.id;
    const [rows]: any = await db.execute(
      "SELECT a.id, a.title, a.content, a.class_id, c.class_name, a.created_at, a.updated_at FROM announcements a LEFT JOIN classes c ON a.class_id = c.id WHERE a.teacher_id = ? ORDER BY a.created_at DESC",
      [teacherId],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil pengumuman" });
  }
};

export const updateAnnouncement = async (req: any, res: any) => {
  const { id } = req.params;
  const { title, content, target_class_id } = req.body;
  const userId = req.user.id;

  try {
    const teacher = await getTeacherByUserId(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }

    const teacherId = teacher.id;
    const [result]: any = await db.execute(
      "UPDATE announcements SET title = ?, content = ?, class_id = ? WHERE id = ? AND teacher_id = ?",
      [title, content, target_class_id, id, teacherId],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pengumuman tidak ditemukan" });
    }
    res.json({ message: "Pengumuman berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ message: "Gagal memperbarui pengumuman" });
  }
};

export const deleteAnnouncement = async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const teacher = await getTeacherByUserId(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }

    const teacherId = teacher.id;
    const [result]: any = await db.execute(
      "DELETE FROM announcements WHERE id = ? AND teacher_id = ?",
      [id, teacherId],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pengumuman tidak ditemukan" });
    }
    res.json({ message: "Pengumuman berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Gagal menghapus pengumuman" });
  }
};

export const submitTeacherAttendance = async (req: any, res: Response) => {
  const { faceDescriptor, lat, lng, type } = req.body;
  const userId = req.user.id;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return res
      .status(400)
      .json({ message: "Lokasi Presensi belum tersedia atau tidak valid." });
  }

  try {
    const settings = await getSystemSettings();
    const distanceMeters = getDistanceInMeters(
      lat,
      lng,
      SCHOOL_LOCATION.lat,
      SCHOOL_LOCATION.lng,
    );

    if (distanceMeters > settings.toleranceMeters) {
      return res.status(400).json({
        message: `Lokasi terlalu jauh dari area Presensi (${Math.round(
          distanceMeters,
        )} m). Batas toleransi ${settings.toleranceMeters} m.`,
      });
    }

    const [rows]: any = await db.execute(
      "SELECT u.full_name, t.face_data FROM users u JOIN teachers t ON u.id = t.user_id WHERE u.id = ?",
      [userId],
    );

    if (!rows[0] || !rows[0].face_data) {
      return res
        .status(400)
        .json({ message: "Anda belum mendaftarkan biometrik wajah." });
    }

    const savedDescriptor = JSON.parse(rows[0].face_data);
    const distance = computeDistance(faceDescriptor, savedDescriptor);

    if (distance > 0.45) {
      return res
        .status(400)
        .json({ message: "Wajah tidak cocok. Silakan coba lagi." });
    }

    const today = new Date().toISOString().slice(0, 10);
    const timeNow = new Date().toTimeString().slice(0, 8);

    const attendanceStatus = determineAttendanceStatus(timeNow, settings);

    const [existing]: any = await db.execute(
      "SELECT id, time_in, time_out FROM attendance WHERE user_id = ? AND date = ?",
      [userId, today],
    );

    if (existing.length > 0) {
      if (type === "out") {
        await db.execute(
          "UPDATE attendance SET time_out = ?, location_lat = ?, location_lng = ? WHERE id = ?",
          [timeNow, lat, lng, existing[0].id],
        );
      } else {
        await db.execute(
          "UPDATE attendance SET time_in = ?, status = ?, location_lat = ?, location_lng = ? WHERE id = ?",
          [timeNow, attendanceStatus, lat, lng, existing[0].id],
        );
      }
    } else {
      await db.execute(
        "INSERT INTO attendance (user_id, date, time_in, status, location_lat, location_lng) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, today, timeNow, attendanceStatus, lat, lng],
      );
    }

    const [updated]: any = await db.execute(
      "SELECT time_in, time_out FROM attendance WHERE user_id = ? AND date = ?",
      [userId, today],
    );

    const updatedRecord = updated[0];
    const checkInTime = updatedRecord.time_in
      ? typeof updatedRecord.time_in === "string"
        ? updatedRecord.time_in
        : new Date(updatedRecord.time_in).toTimeString().slice(0, 8)
      : null;
    const checkOutTime = updatedRecord.time_out
      ? typeof updatedRecord.time_out === "string"
        ? updatedRecord.time_out
        : new Date(updatedRecord.time_out).toTimeString().slice(0, 8)
      : null;

    res.json({
      message: `Presensi ${type === "in" ? "masuk" : "pulang"} berhasil`,
      name: rows[0].full_name,
      status: "success",
      type: type,
      attendanceStatus: {
        checkedIn: !!checkInTime,
        checkedOut: !!checkOutTime,
        checkInTime: checkInTime,
        checkOutTime: checkOutTime,
      },
    });
  } catch (error) {
    console.error("Error in submitTeacherAttendance:", error);
    res.status(500).json({ message: "Gagal memproses Presensi" });
  }
};

export const getTeacherAttendanceStatus = async (req: any, res: Response) => {
  const { date } = req.query;
  const userId = req.user?.id;

  if (!userId) {
    console.error("❌ User tidak terautentikasi - userId kosong");
    return res.status(401).json({ message: "User tidak terautentikasi" });
  }

  if (!date) {
    return res.status(400).json({ message: "Parameter date diperlukan" });
  }

  try {
    const [rows]: any = await db.execute(
      "SELECT time_in, time_out FROM attendance WHERE user_id = ? AND date = ?",
      [userId, date],
    );

    if (Array.isArray(rows) && rows.length > 0) {
      const timeIn = rows[0].time_in;
      const timeOut = rows[0].time_out;

      const formattedTimeIn =
        timeIn &&
        (typeof timeIn === "string"
          ? timeIn
          : timeIn?.toTimeString?.().slice(0, 8) ||
            new Date(timeIn).toTimeString().slice(0, 8));

      const formattedTimeOut =
        timeOut &&
        (typeof timeOut === "string"
          ? timeOut
          : timeOut?.toTimeString?.().slice(0, 8) ||
            new Date(timeOut).toTimeString().slice(0, 8));

      res.json({
        checkedIn: !!timeIn,
        checkedOut: !!timeOut,
        checkInTime: formattedTimeIn || null,
        checkOutTime: formattedTimeOut || null,
      });
    } else {
      res.json({
        checkedIn: false,
        checkedOut: false,
      });
    }
  } catch (error) {
    console.error("Error in getTeacherAttendanceStatus:", error);
    res.status(500).json({ message: "Gagal mengambil status Presensi" });
  }
};

export const getMyClasses = async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const [teachers]: any = await db.execute(
      "SELECT id FROM teachers WHERE user_id = ?",
      [userId],
    );

    if (teachers.length === 0) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }

    const teacherId = teachers[0].id;

    const [rows]: any = await db.execute(
      `SELECT id, class_name, major 
       FROM classes
       WHERE homeroom_teacher_id = ?
       ORDER BY class_name ASC`,
      [teacherId],
    );

    res.json(rows);
  } catch (error) {
    console.error("Error fetching my classes:", error);
    res.status(500).json({ message: "Gagal mengambil data kelas" });
  }
};

export const getStudentsByClass = async (req: any, res: Response) => {
  const { classId } = req.params;
  const { date } = req.query;
  const teacherId = req.user.id;

  if (!classId) {
    return res.status(400).json({ message: "Parameter classId wajib diisi" });
  }

  const attendanceDate = date
    ? String(date)
    : new Date().toISOString().slice(0, 10);

  try {
    const teacher = await getTeacherByUserId(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }

    const [rows]: any = await db.execute(
      `SELECT 
        u.id as user_id,
        s.nisn,
        u.full_name,
        a.status,
        a.time_in
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN attendance a ON a.user_id = s.user_id AND a.date = ?
       WHERE s.class_id = ?
       ORDER BY u.full_name ASC`,
      [attendanceDate, classId],
    );

    res.json(rows);
  } catch (error) {
    console.error("Error in getStudentsByClass:", error);
    res.status(500).json({ message: "Gagal mengambil data siswa" });
  }
};

export const manualAttendance = async (req: any, res: Response) => {
  const { studentId, status, classId } = req.body;
  const teacherId = req.user.id;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const timeNow = new Date().toTimeString().slice(0, 8);

    const [existing]: any = await db.execute(
      "SELECT id FROM attendance WHERE user_id = ? AND date = ?",
      [studentId, today],
    );

    if (existing.length > 0) {
      await db.execute(
        "UPDATE attendance SET status = ?, time_in = ? WHERE user_id = ? AND date = ?",
        [status, timeNow, studentId, today],
      );
    } else {
      await db.execute(
        "INSERT INTO attendance (user_id, date, time_in, status) VALUES (?, ?, ?, ?)",
        [studentId, today, timeNow, status],
      );
    }

    res.json({ message: "Presensi berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui Presensi" });
  }
};

export const getTeacherFaceStatus = async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const [rows]: any = await db.execute(
      "SELECT face_data FROM teachers WHERE user_id = ?",
      [userId],
    );
    res.json({ hasFace: !!(rows[0] && rows[0].face_data) });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil status wajah" });
  }
};

const normalizeFaceImage = (faceImage: string) => {
  if (!faceImage) return faceImage;
  const commaIndex = faceImage.indexOf(",");
  if (commaIndex !== -1 && faceImage.startsWith("data:")) {
    return faceImage.slice(commaIndex + 1);
  }
  return faceImage;
};

export const registerTeacherFace = async (req: any, res: Response) => {
  const { faceDescriptor, faceImage } = req.body;
  const userId = req.user.id;

  try {
    const normalizedFaceImage = normalizeFaceImage(faceImage);

    await db.execute(
      "UPDATE teachers SET face_data = ?, face_image = ? WHERE user_id = ?",
      [JSON.stringify(faceDescriptor), normalizedFaceImage, userId],
    );

    res.json({ message: "Pendaftaran wajah berhasil" });
  } catch (error) {
    console.error("Error in registerTeacherFace:", error);
    res.status(500).json({ message: "Gagal mendaftarkan wajah" });
  }
};

export const getTeachingSchedule = async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const teacher = await getTeacherByUserId(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }
    const teacherId = teacher.id;

    const [rows]: any = await db.execute(
      `SELECT s.id, s.day, s.start_time, s.end_time, s.subject, 
              s.class_id, s.room, s.attachment, c.class_name
       FROM schedules s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.teacher_id = ?
       ORDER BY FIELD(s.day, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'), s.start_time ASC`,
      [teacherId],
    );

    const formattedSchedule = rows.map((row: any) => ({
      id: row.id,
      day: row.day,
      start_time: row.start_time,
      end_time: row.end_time,
      time_range: `${row.start_time} - ${row.end_time}`,
      subject_name: row.subject,
      class_id: row.class_id,
      class_name: row.class_name || "-",
      room: row.room || "-",
      attachment: row.attachment || null,
    }));

    res.json(formattedSchedule);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil jadwal mengajar" });
  }
};

export const createSchedule = async (req: any, res: Response) => {
  const { day, start_time, end_time, subject, class_id, room } = req.body;
  const userId = req.user.id;

  try {
    const teacher = await getTeacherByUserId(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }
    const teacherId = teacher.id;

    if (!day || !start_time || !end_time || !subject || !class_id) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    await db.execute(
      `INSERT INTO schedules (day, start_time, end_time, subject, class_id, room, teacher_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [day, start_time, end_time, subject, class_id, room || null, teacherId],
    );

    res.json({ message: "Jadwal berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan jadwal" });
  }
};

export const updateSchedule = async (req: any, res: Response) => {
  const { id } = req.params;
  const { day, start_time, end_time, subject, class_id, room } = req.body;
  const userId = req.user.id;

  try {
    const teacher = await getTeacherByUserId(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }
    const teacherId = teacher.id;

    if (!day || !start_time || !end_time || !subject || !class_id) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    const [check]: any = await db.execute(
      "SELECT id FROM schedules WHERE id = ? AND teacher_id = ?",
      [id, teacherId],
    );

    if (check.length === 0) {
      return res
        .status(403)
        .json({ message: "Anda tidak memiliki akses ke jadwal ini" });
    }

    await db.execute(
      `UPDATE schedules 
       SET day = ?, start_time = ?, end_time = ?, subject = ?, class_id = ?, room = ?
       WHERE id = ? AND teacher_id = ?`,
      [
        day,
        start_time,
        end_time,
        subject,
        class_id,
        room || null,
        id,
        teacherId,
      ],
    );

    res.json({ message: "Jadwal berhasil diupdate" });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengupdate jadwal" });
  }
};

export const deleteSchedule = async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const teacher = await getTeacherByUserId(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }
    const teacherId = teacher.id;

    const [check]: any = await db.execute(
      "SELECT id FROM schedules WHERE id = ? AND teacher_id = ?",
      [id, teacherId],
    );

    if (check.length === 0) {
      return res
        .status(403)
        .json({ message: "Anda tidak memiliki akses ke jadwal ini" });
    }

    await db.execute("DELETE FROM schedules WHERE id = ? AND teacher_id = ?", [
      id,
      teacherId,
    ]);

    res.json({ message: "Jadwal berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus jadwal" });
  }
};

export const getMyPermits = async (req: any, res: Response) => {
  const userId = req.user.id;

  try {
    const [rows]: any = await db.execute(
      `SELECT id, permit_type, start_date, end_date, reason, 
              attachment_url, status, rejection_reason, created_at, updated_at
       FROM teacher_permits 
       WHERE teacher_id = ? 
       ORDER BY created_at DESC`,
      [userId],
    );

    const formattedPermits = rows.map((permit: any) => ({
      id: permit.id,
      type: permit.permit_type,
      typeLabel: getPermitTypeLabel(permit.permit_type),
      startDate: permit.start_date,
      endDate: permit.end_date,
      reason: permit.reason,
      attachment: permit.attachment_url,
      attachmentUrl: permit.attachment_url,
      status: permit.status,
      statusLabel: getStatusLabel(permit.status),
      rejectionReason: permit.rejection_reason,
      createdAt: permit.created_at,
      updatedAt: permit.updated_at,
    }));

    res.json(formattedPermits);
  } catch (error) {
    console.error("Error in getMyPermits:", error);
    res.status(500).json({ message: "Gagal mengambil data izin" });
  }
};

/**
 * Get single permit detail
 */
export const getPermitDetail = async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [rows]: any = await db.execute(
      `SELECT id, permit_type, start_date, end_date, reason, 
              attachment_url, status, rejection_reason, created_at, updated_at
       FROM teacher_permits 
       WHERE id = ? AND teacher_id = ?`,
      [id, userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Data izin tidak ditemukan" });
    }

    const permit = rows[0];
    res.json({
      id: permit.id,
      type: permit.permit_type,
      typeLabel: getPermitTypeLabel(permit.permit_type),
      startDate: permit.start_date,
      endDate: permit.end_date,
      reason: permit.reason,
      attachment: permit.attachment_url,
      status: permit.status,
      statusLabel: getStatusLabel(permit.status),
      rejectionReason: permit.rejection_reason,
      createdAt: permit.created_at,
      updatedAt: permit.updated_at,
    });
  } catch (error) {
    console.error("Error in getPermitDetail:", error);
    res.status(500).json({ message: "Gagal mengambil detail izin" });
  }
};

export const createPermit = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { permit_type, start_date, end_date, reason, attachment_url } =
    req.body;

  if (!permit_type || !start_date || !end_date || !reason) {
    return res.status(400).json({
      message:
        "Semua field wajib diisi: jenis izin, tanggal mulai, tanggal selesai, dan alasan",
    });
  }

  if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({
      message: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai",
    });
  }

  try {
    const normalizedAttachmentUrl =
      attachment_url &&
      typeof attachment_url === "string" &&
      attachment_url.trim() !== ""
        ? attachment_url.trim()
        : null;

    const [result]: any = await db.execute(
      `INSERT INTO teacher_permits 
       (teacher_id, permit_type, start_date, end_date, reason, attachment_url, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        permit_type,
        start_date,
        end_date,
        reason,
        normalizedAttachmentUrl,
      ],
    );

    res.json({
      message: "Pengajuan izin berhasil dikirim",
      id: result.insertId,
      attachment_url: normalizedAttachmentUrl,
    });
  } catch (error) {
    console.error("Error in createPermit:", error);
    res.status(500).json({ message: "Gagal mengirim pengajuan izin" });
  }
};

export const cancelPermit = async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [check]: any = await db.execute(
      "SELECT id, status FROM teacher_permits WHERE id = ? AND teacher_id = ?",
      [id, userId],
    );

    if (check.length === 0) {
      return res.status(404).json({ message: "Data izin tidak ditemukan" });
    }

    if (check[0].status !== "pending") {
      return res.status(400).json({
        message:
          "Hanya pengajuan dengan status 'Menunggu' yang dapat dibatalkan",
      });
    }

    await db.execute(
      "DELETE FROM teacher_permits WHERE id = ? AND teacher_id = ?",
      [id, userId],
    );

    res.json({ message: "Pengajuan izin berhasil dibatalkan" });
  } catch (error) {
    console.error("Error in cancelPermit:", error);
    res.status(500).json({ message: "Gagal membatalkan pengajuan izin" });
  }
};

export const updatePermit = async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { permit_type, start_date, end_date, reason, attachment_url } =
    req.body;

  try {
    const [check]: any = await db.execute(
      "SELECT id, status FROM teacher_permits WHERE id = ? AND teacher_id = ?",
      [id, userId],
    );

    if (check.length === 0) {
      return res.status(404).json({ message: "Data izin tidak ditemukan" });
    }

    if (check[0].status !== "pending") {
      return res.status(400).json({
        message: "Hanya pengajuan dengan status 'Menunggu' yang dapat diubah",
      });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (permit_type) {
      updates.push("permit_type = ?");
      values.push(permit_type);
    }
    if (start_date) {
      updates.push("start_date = ?");
      values.push(start_date);
    }
    if (end_date) {
      updates.push("end_date = ?");
      values.push(end_date);
    }
    if (reason) {
      updates.push("reason = ?");
      values.push(reason);
    }
    if (attachment_url !== undefined) {
      updates.push("attachment_url = ?");
      values.push(attachment_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Tidak ada data yang diubah" });
    }

    values.push(id, userId);

    await db.execute(
      `UPDATE teacher_permits SET ${updates.join(", ")} WHERE id = ? AND teacher_id = ?`,
      values,
    );

    res.json({ message: "Pengajuan izin berhasil diupdate" });
  } catch (error) {
    console.error("Error in updatePermit:", error);
    res.status(500).json({ message: "Gagal mengupdate pengajuan izin" });
  }
};

export const getStudentPermits = async (req: any, res: Response) => {
  const userId = req.user.id;

  try {
    const [teacher]: any = await db.execute(
      `SELECT id FROM teachers WHERE user_id = ?`,
      [userId],
    );

    if (teacher.length === 0) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }

    const teacherId = teacher[0].id;

    const [teacherClasses]: any = await db.execute(
      `SELECT DISTINCT class_id FROM schedules WHERE teacher_id = ?`,
      [teacherId],
    );

    let classIds: number[] = [];

    if (teacherClasses.length > 0) {
      classIds = teacherClasses.map((c: any) => c.class_id);
    } else {
      const [teacherClassRel]: any = await db.execute(
        `SELECT class_id FROM teacher_class WHERE teacher_id = ?`,
        [teacherId],
      );
      classIds = teacherClassRel.map((c: any) => c.class_id);
    }

    if (classIds.length === 0) {
      return res.json([]);
    }

    const placeholders = classIds.map(() => "?").join(",");
    const [rows]: any = await db.execute(
      `SELECT 
        sp.id,
        sp.student_id,
        sp.permit_type,
        sp.start_date,
        sp.end_date,
        sp.reason,
        sp.attachment_url,
        sp.status,
        sp.rejection_reason,
        sp.created_at,
        sp.updated_at,
        u.full_name as student_name,
        s.nisn,
        c.class_name
       FROM student_permits sp
       JOIN users u ON sp.student_id = u.id
       JOIN students s ON sp.student_id = s.user_id
       JOIN classes c ON s.class_id = c.id
       WHERE s.class_id IN (${placeholders})
       ORDER BY 
         FIELD(sp.status, 'pending', 'approved', 'rejected'),
         sp.created_at DESC`,
      classIds,
    );

    const formattedPermits = rows.map((permit: any) => ({
      id: permit.id,
      studentId: permit.student_id,
      studentName: permit.student_name,
      nisn: permit.nisn,
      className: permit.class_name,
      type: permit.permit_type,
      typeLabel: getPermitTypeLabel(permit.permit_type),
      startDate: permit.start_date,
      endDate: permit.end_date,
      reason: permit.reason,
      attachment: permit.attachment_url,
      attachmentUrl: permit.attachment_url,
      status: permit.status,
      statusLabel: getStatusLabel(permit.status),
      rejectionReason: permit.rejection_reason,
      createdAt: permit.created_at,
      updatedAt: permit.updated_at,
    }));

    res.json(formattedPermits);
  } catch (error) {
    console.error("Error in getStudentPermits:", error);
    res.status(500).json({ message: "Gagal mengambil data izin siswa" });
  }
};

export const approveStudentPermit = async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [teacher]: any = await db.execute(
      `SELECT id FROM teachers WHERE user_id = ?`,
      [userId],
    );

    if (teacher.length === 0) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }

    const teacherId = teacher[0].id;

    const [check]: any = await db.execute(
      `SELECT sp.id 
       FROM student_permits sp
       JOIN students s ON sp.student_id = s.user_id
       WHERE sp.id = ?
       AND s.class_id IN (
         SELECT DISTINCT class_id FROM schedules WHERE teacher_id = ?
         UNION
         SELECT class_id FROM teacher_class WHERE teacher_id = ?
       )`,
      [id, teacherId, teacherId],
    );

    if (check.length === 0) {
      return res
        .status(403)
        .json({ message: "Anda tidak memiliki akses ke izin ini" });
    }

    await db.execute(
      `UPDATE student_permits 
       SET status = 'approved', approved_by = ?, approved_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [teacherId, id],
    );

    res.json({ message: "Izin berhasil disetujui" });
  } catch (error) {
    console.error("Error in approveStudentPermit:", error);
    res.status(500).json({ message: "Gagal menyetujui izin" });
  }
};

export const rejectStudentPermit = async (req: any, res: Response) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;
  const userId = req.user.id;

  if (!rejection_reason) {
    return res.status(400).json({ message: "Alasan penolakan harus diisi" });
  }

  try {
    const [teacher]: any = await db.execute(
      `SELECT id FROM teachers WHERE user_id = ?`,
      [userId],
    );

    if (teacher.length === 0) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }

    const teacherId = teacher[0].id;

    const [check]: any = await db.execute(
      `SELECT sp.id 
       FROM student_permits sp
       JOIN students s ON sp.student_id = s.user_id
       WHERE sp.id = ?
       AND s.class_id IN (
         SELECT DISTINCT class_id FROM schedules WHERE teacher_id = ?
         UNION
         SELECT class_id FROM teacher_class WHERE teacher_id = ?
       )`,
      [id, teacherId, teacherId],
    );

    if (check.length === 0) {
      return res
        .status(403)
        .json({ message: "Anda tidak memiliki akses ke izin ini" });
    }

    await db.execute(
      `UPDATE student_permits 
       SET status = 'rejected', rejection_reason = ?, approved_by = ?, approved_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [rejection_reason, teacherId, id],
    );

    res.json({ message: "Izin ditolak" });
  } catch (error) {
    console.error("Error in rejectStudentPermit:", error);
    res.status(500).json({ message: "Gagal menolak izin" });
  }
};

export const getStudentPermitDetail = async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [teacher]: any = await db.execute(
      `SELECT id FROM teachers WHERE user_id = ?`,
      [userId],
    );

    if (teacher.length === 0) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }

    const teacherId = teacher[0].id;

    const [rows]: any = await db.execute(
      `SELECT 
        sp.id,
        sp.student_id,
        sp.permit_type,
        sp.start_date,
        sp.end_date,
        sp.reason,
        sp.attachment_url,
        sp.status,
        sp.rejection_reason,
        sp.approved_by,
        sp.approved_at,
        sp.created_at,
        sp.updated_at,
        u.full_name as student_name,
        s.nisn,
        c.class_name
       FROM student_permits sp
       JOIN users u ON sp.student_id = u.id
       JOIN students s ON sp.student_id = s.user_id
       JOIN classes c ON s.class_id = c.id
       WHERE sp.id = ?
       AND s.class_id IN (
         SELECT DISTINCT class_id FROM schedules WHERE teacher_id = ?
         UNION
         SELECT class_id FROM teacher_class WHERE teacher_id = ?
       )`,
      [id, teacherId, teacherId],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Data izin tidak ditemukan atau akses ditolak" });
    }

    const permit = rows[0];
    res.json({
      id: permit.id,
      studentId: permit.student_id,
      studentName: permit.student_name,
      nisn: permit.nisn,
      className: permit.class_name,
      type: permit.permit_type,
      typeLabel: getPermitTypeLabel(permit.permit_type),
      startDate: permit.start_date,
      endDate: permit.end_date,
      reason: permit.reason,
      attachment: permit.attachment_url,
      status: permit.status,
      statusLabel: getStatusLabel(permit.status),
      rejectionReason: permit.rejection_reason,
      createdAt: permit.created_at,
      updatedAt: permit.updated_at,
    });
  } catch (error) {
    console.error("Error in getStudentPermitDetail:", error);
    res.status(500).json({ message: "Gagal mengambil detail izin" });
  }
};

const getPermitTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    sick: "Sakit",
    leave: "Cuti",
    business: "Keperluan",
    remote: "Belajar Dari Rumah",
  };
  return labels[type] || type;
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
  };
  return labels[status] || status;
};

export const bulkAttendance = async (req: any, res: Response) => {
  const { classId, date, status } = req.body;
  const teacherId = req.user.id;

  if (!classId || !date || !status) {
    return res.status(400).json({
      message: "Parameter classId, date, dan status wajib diisi",
    });
  }

  const validStatuses = ["hadir", "sakit", "izin", "alpa"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      message: "Status tidak valid. Gunakan: hadir, sakit, izin, alpa",
    });
  }

  try {
    const [students]: any = await db.execute(
      `SELECT s.user_id 
       FROM students s 
       WHERE s.class_id = ?`,
      [classId],
    );

    if (students.length === 0) {
      return res.status(404).json({ message: "Tidak ada siswa di kelas ini" });
    }

    const timeNow = new Date().toTimeString().slice(0, 8);

    let updatedCount = 0;
    let insertedCount = 0;

    for (const student of students) {
      const [existing]: any = await db.execute(
        "SELECT id FROM attendance WHERE user_id = ? AND date = ?",
        [student.user_id, date],
      );

      if (existing.length > 0) {
        await db.execute(
          "UPDATE attendance SET status = ?, time_in = ? WHERE user_id = ? AND date = ?",
          [status, timeNow, student.user_id, date],
        );
        updatedCount++;
      } else {
        await db.execute(
          "INSERT INTO attendance (user_id, date, time_in, status) VALUES (?, ?, ?, ?)",
          [student.user_id, date, timeNow, status],
        );
        insertedCount++;
      }
    }

    res.json({
      message: `Berhasil update Presensi: ${insertedCount} data baru, ${updatedCount} data diupdate`,
      total: students.length,
      updated: updatedCount,
      inserted: insertedCount,
    });
  } catch (error) {
    console.error("Error in bulkAttendance:", error);
    res.status(500).json({ message: "Gagal update Presensi masal" });
  }
};

export const exportAttendance = async (req: any, res: Response) => {
  const { classId } = req.params;
  const { date } = req.query;
  const teacherId = req.user.id;

  if (!classId) {
    return res.status(400).json({ message: "Parameter classId wajib diisi" });
  }

  const attendanceDate = date
    ? String(date)
    : new Date().toISOString().slice(0, 10);

  try {
    const [classInfo]: any = await db.execute(
      `SELECT class_name, major FROM classes WHERE id = ?`,
      [classId],
    );

    if (classInfo.length === 0) {
      return res.status(404).json({ message: "Kelas tidak ditemukan" });
    }

    const [students]: any = await db.execute(
      `SELECT 
        s.nisn,
        u.full_name as student_name,
        COALESCE(a.status, 'alpa') as status,
        a.time_in,
        a.time_out,
        a.location_lat,
        a.location_lng
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN attendance a ON a.user_id = s.user_id AND a.date = ?
       WHERE s.class_id = ?
       ORDER BY u.full_name ASC`,
      [attendanceDate, classId],
    );

    const headers = [
      "No",
      "NISN",
      "Nama Siswa",
      "Status",
      "Jam Masuk",
      "Jam Keluar",
      "Keterangan",
    ];
    const rows = students.map((student: any, index: number) => [
      index + 1,
      student.nisn,
      student.student_name,
      getStatusLabelForExport(student.status),
      student.time_in || "-",
      student.time_out || "-",
      getStatusNote(student.status),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any[]) =>
        row.map((cell: string) => `"${cell}"`).join(","),
      ),
    ].join("\n");

    const metadata = [
      `"Laporan Presensi Kelas ${classInfo[0].class_name} - ${classInfo[0].major}"`,
      `"Tanggal: ${dayjs(attendanceDate).format("DD/MM/YYYY")}"`,
      `"Total Siswa: ${students.length}"`,
      `"Hadir: ${students.filter((s: any) => s.status === "hadir").length}"`,
      `"Sakit: ${students.filter((s: any) => s.status === "sakit").length}"`,
      `"Izin: ${students.filter((s: any) => s.status === "izin").length}"`,
      `"Alpa: ${students.filter((s: any) => s.status === "alpa").length}"`,
      "",
      "",
    ].join("\n");

    const finalContent = metadata + csvContent;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=presensi_kelas_${classId}_${attendanceDate}.csv`,
    );

    const bom = "\uFEFF";
    res.send(bom + finalContent);
  } catch (error) {
    console.error("Error in exportAttendance:", error);
    res.status(500).json({ message: "Gagal mengekspor data Presensi" });
  }
};

const getStatusLabelForExport = (status: string): string => {
  switch (status) {
    case "hadir":
      return "Hadir";
    case "sakit":
      return "Sakit";
    case "izin":
      return "Izin";
    case "alpa":
      return "Alpa";
    default:
      return "Alpa";
  }
};

const getStatusNote = (status: string): string => {
  switch (status) {
    case "sakit":
      return "Siswa sakit, diharapkan membawa surat dokter";
    case "izin":
      return "Siswa izin, orang tua telah mengkonfirmasi";
    case "alpa":
      return "Tidak hadir tanpa keterangan";
    default:
      return "-";
  }
};

export const uploadScheduleAttachment = async (req: any, res: Response) => {
  const { scheduleId } = req.params;
  const { attachment } = req.body;
  const userId = req.user.id;

  if (!scheduleId || !attachment) {
    return res.status(400).json({
      message: "Schedule ID dan attachment wajib diisi",
    });
  }

  try {
    const teacher = await getTeacherByUserId(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }
    const teacherId = teacher.id;

    const [scheduleCheck]: any = await db.execute(
      "SELECT id, class_id, subject, day, start_time FROM schedules WHERE id = ? AND teacher_id = ?",
      [scheduleId, teacherId],
    );

    if (scheduleCheck.length === 0) {
      return res.status(403).json({
        message: "Anda tidak memiliki akses ke jadwal ini",
      });
    }

    await db.execute(
      "UPDATE schedules SET attachment = ?, updated_at = NOW() WHERE id = ?",
      [attachment, scheduleId],
    );

    res.json({
      message: "Lampiran berhasil diupload",
      scheduleId: scheduleId,
      attachment: attachment,
    });
  } catch (error) {
    console.error("Error in uploadScheduleAttachment:", error);
    res.status(500).json({ message: "Gagal mengupload lampiran" });
  }
};

export const getScheduleAttachment = async (req: any, res: Response) => {
  const { scheduleId } = req.params;
  const userId = req.user.id;

  try {
    const teacher = await getTeacherByUserId(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }
    const teacherId = teacher.id;

    const [rows]: any = await db.execute(
      "SELECT id, attachment FROM schedules WHERE id = ? AND teacher_id = ?",
      [scheduleId, teacherId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Data jadwal tidak ditemukan" });
    }

    res.json({
      scheduleId: rows[0].id,
      attachment: rows[0].attachment,
    });
  } catch (error) {
    console.error("Error in getScheduleAttachment:", error);
    res.status(500).json({ message: "Gagal mengambil lampiran" });
  }
};

export const deleteScheduleAttachment = async (req: any, res: Response) => {
  const { scheduleId } = req.params;
  const userId = req.user.id;

  if (!scheduleId) {
    return res.status(400).json({
      message: "Schedule ID wajib diisi",
    });
  }

  try {
    const teacher = await getTeacherByUserId(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Data guru tidak ditemukan" });
    }
    const teacherId = teacher.id;

    const [scheduleCheck]: any = await db.execute(
      "SELECT id FROM schedules WHERE id = ? AND teacher_id = ?",
      [scheduleId, teacherId],
    );

    if (scheduleCheck.length === 0) {
      return res.status(403).json({
        message: "Anda tidak memiliki akses ke jadwal ini",
      });
    }

    await db.execute(
      "UPDATE schedules SET attachment = NULL, updated_at = NOW() WHERE id = ?",
      [scheduleId],
    );

    res.json({
      message: "Lampiran berhasil dihapus",
      scheduleId: scheduleId,
    });
  } catch (error) {
    console.error("Error in deleteScheduleAttachment:", error);
    res.status(500).json({ message: "Gagal menghapus lampiran" });
  }
};
