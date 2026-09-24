/** @format */

import type { Request, Response } from "express";
import db from "../config/database.js";
import {
  getSystemSettings,
  determineAttendanceStatus,
} from "../utils/systemSettings.js";
import { SCHOOL_LOCATION, getDistanceInMeters } from "../utils/geolocation.js";

const getAttendanceDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(date);

const getAttendanceTime = (date = new Date()) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);

const formatAttendanceTime = (timeValue: any): string | null => {
  if (!timeValue) return null;

  if (typeof timeValue === "string") {
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeValue)) {
      return timeValue;
    }

    try {
      const date = new Date(timeValue);
      if (!isNaN(date.getTime())) {
        return date.toTimeString().slice(0, 8);
      }
    } catch (error) {}

    return timeValue.slice(0, 8) || null;
  }

  if (timeValue instanceof Date) {
    return timeValue.toTimeString().slice(0, 8);
  }

  return null;
};

const computeDistance = (desc1: number[], desc2: number[]) => {
  if (!desc1 || !desc2) {
    throw new Error("Descriptor tidak boleh kosong (null/undefined)");
  }
  if (!Array.isArray(desc1) || !Array.isArray(desc2)) {
    throw new Error("Descriptor harus berupa array");
  }
  if (desc1.length !== desc2.length) {
    throw new Error(
      `Descriptor panjang tidak sama: ${desc1.length} vs ${desc2.length}`,
    );
  }

  return Math.sqrt(
    desc1.reduce((acc, val, i) => {
      const other = desc2[i] ?? 0;
      return acc + Math.pow(val - other, 2);
    }, 0),
  );
};

const getStudentByUserId = async (userId: number) => {
  const [studentRows]: any = await db.execute(
    "SELECT id FROM students WHERE user_id = ?",
    [userId],
  );
  return studentRows[0];
};

const getPermitTypeLabel = (permitType: string): string => {
  const labels: { [key: string]: string } = {
    sick: "Sakit",
    permission: "Izin",
    home_visit: "Kunjungan Rumah",
  };
  return labels[permitType] || permitType;
};

const getStatusLabel = (status: string): string => {
  const labels: { [key: string]: string } = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
  };
  return labels[status] || status;
};

export const getDashboardStats = async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [attendanceRows]: any = await db.execute(
      `SELECT id, time_in, time_out, status FROM attendance 
       WHERE user_id = ? AND date = ?`,
      [userId, today],
    );

    const checkedIn = attendanceRows.length > 0 && !!attendanceRows[0].time_in;
    const checkedOut =
      attendanceRows.length > 0 && !!attendanceRows[0].time_out;
    const status = attendanceRows.length > 0 ? attendanceRows[0].status : null;

    const student = await getStudentByUserId(userId);
    const [scheduleRows]: any = await db.execute(
      `SELECT s.id, s.day, s.start_time, s.end_time, s.subject, s.room, c.class_name
       FROM schedules s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.class_id = (SELECT class_id FROM students WHERE user_id = ?)
       ORDER BY s.start_time ASC`,
      [userId],
    );

    const [announcementRows]: any = await db.execute(
      `SELECT a.id, a.title, a.content, a.created_at
       FROM announcements a
       WHERE a.class_id = (SELECT class_id FROM students WHERE user_id = ?)
       ORDER BY a.created_at DESC LIMIT 5`,
      [userId],
    );

    res.json({
      attendance: {
        checkedIn,
        checkedOut,
        status,
      },
      schedule: scheduleRows,
      announcements: announcementRows,
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({ message: "Gagal mengambil data dashboard" });
  }
};

export const getStudentAnnouncements = async (req: any, res: Response) => {
  const userId = req.user.id;

  try {
    const [studentRows]: any = await db.execute(
      `SELECT class_id FROM students WHERE user_id = ?`,
      [userId],
    );

    if (studentRows.length === 0) {
      return res.status(404).json({ message: "Data siswa tidak ditemukan" });
    }

    const classId = studentRows[0].class_id;

    const [rows]: any = await db.execute(
      `SELECT a.id, a.title, a.content, a.created_at, a.updated_at, 
              u.full_name as teacher_name, a.class_id
       FROM announcements a
       LEFT JOIN teachers t ON a.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE (a.class_id = ? OR a.class_id IS NULL)
       ORDER BY a.created_at DESC`,
      [classId],
    );

    const cleanedRows = rows.map((row: any) => {
      const { class_id, ...rest } = row;
      return rest;
    });

    res.json(cleanedRows);
  } catch (err) {
    console.error("Error getting announcements:", err);
    res.status(500).json({ message: "Gagal mengambil pengumuman" });
  }
};

export const submitStudentAttendance = async (req: any, res: Response) => {
  const { faceDescriptor, lat, lng, type } = req.body;
  const userId = req.user.id;

  if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
    return res.status(400).json({
      message:
        "Face descriptor tidak valid. Pastikan wajah terdeteksi dengan baik.",
    });
  }

  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({
      message: "Lokasi Presensi belum tersedia atau tidak valid.",
    });
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
      `SELECT u.full_name, s.face_data FROM users u 
       JOIN students s ON u.id = s.user_id 
       WHERE u.id = ?`,
      [userId],
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: "Data siswa tidak ditemukan!",
      });
    }

    if (!rows[0].face_data) {
      return res.status(400).json({
        message: "Wajah belum didaftarkan!",
      });
    }

    let savedDescriptor;
    try {
      savedDescriptor = JSON.parse(rows[0].face_data);
    } catch (parseError) {
      console.error("[ERROR] Failed to parse face_data:", parseError);
      return res.status(500).json({
        message: "Data wajah tersimpan rusak. Silakan daftar ulang wajah.",
      });
    }

    const distance = computeDistance(faceDescriptor, savedDescriptor);

    if (distance > 0.45) {
      return res.status(401).json({
        message: "Wajah tidak cocok. Silakan coba lagi.",
      });
    }

    const today = getAttendanceDate();
    const timeNow = getAttendanceTime();

    const attendanceStatus = determineAttendanceStatus(timeNow, settings);

    const [existing]: any = await db.execute(
      "SELECT id, time_in, time_out FROM attendance WHERE user_id = ? AND date = ?",
      [userId, today],
    );

    if (type === "in") {
      if (existing.length > 0 && existing[0].time_in) {
        return res.status(400).json({
          message: "Anda sudah melakukan Presensi masuk hari ini.",
        });
      }

      if (existing.length > 0) {
        await db.execute(
          `UPDATE attendance SET time_in = ?, status = ?, location_lat = ?, location_lng = ? 
           WHERE user_id = ? AND date = ?`,
          [timeNow, attendanceStatus, lat, lng, userId, today],
        );
      } else {
        await db.execute(
          `INSERT INTO attendance (user_id, date, time_in, status, location_lat, location_lng) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, today, timeNow, attendanceStatus, lat, lng],
        );
      }

      return res.json({
        message: "Presensi Masuk Berhasil!",
        name: rows[0].full_name,
        time_in: timeNow,
        status: attendanceStatus,
        attendanceStatus: {
          checkedIn: true,
          checkedOut: false,
          checkInTime: timeNow,
        },
      });
    } else if (type === "out") {
      if (existing[0]?.time_out) {
        return res.status(400).json({
          message: "Anda sudah melakukan Presensi pulang hari ini.",
        });
      }

      if (existing.length > 0) {
        await db.execute(
          `UPDATE attendance SET time_out = ? WHERE user_id = ? AND date = ?`,
          [timeNow, userId, today],
        );

        return res.json({
          message: "Presensi Pulang Berhasil!",
          name: rows[0].full_name,
          time_out: timeNow,
          attendanceStatus: {
            checkedIn: !!existing[0].time_in,
            checkedOut: true,
            checkInTime: existing[0].time_in,
            checkOutTime: timeNow,
          },
        });
      } else {
        await db.execute(
          `INSERT INTO attendance (user_id, date, time_out, status, location_lat, location_lng) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, today, timeNow, attendanceStatus, lat, lng],
        );

        return res.json({
          message: "Presensi Pulang Berhasil!",
          name: rows[0].full_name,
          time_out: timeNow,
          attendanceStatus: {
            checkedIn: false,
            checkedOut: true,
            checkOutTime: timeNow,
          },
        });
      }
    }

    return res.status(400).json({ message: "Tipe Presensi tidak valid" });
  } catch (error) {
    console.error("Error in submitStudentAttendance:", error);
    return res.status(500).json({ message: "Gagal memproses Presensi" });
  }
};

export const getStudentAttendanceHistory = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { date, startDate, endDate, month } = req.query;

  try {
    let start = "";
    let end = "";

    if (date) {
      start = String(date);
      end = String(date);
    } else if (startDate && endDate) {
      start = String(startDate);
      end = String(endDate);
    } else if (month) {
      const targetMonth = String(month);
      start = `${targetMonth}-01`;
      const [yearRaw, monthRaw] = targetMonth.split("-");
      const year = Number(yearRaw) || new Date().getFullYear();
      const monthPart = Number(monthRaw) || new Date().getMonth() + 1;
      const lastDay = new Date(year, monthPart, 0).getDate();
      end = `${targetMonth}-${String(lastDay).padStart(2, "0")}`;
    } else {
      const today = getAttendanceDate();
      start = today;
      end = today;
    }

    const [rows]: any = await db.execute(
      `SELECT a.id, a.date, a.time_in, a.time_out, a.status, 
              a.location_lat, a.location_lng
       FROM attendance a
       WHERE a.user_id = ? AND DATE(CONVERT_TZ(a.date, '+00:00', '+07:00')) BETWEEN ? AND ?`,
      [userId, start, end],
    );

    const normalizeAttendanceDate = (value: unknown) => {
      if (value instanceof Date) {
        return getAttendanceDate(value);
      }
      if (typeof value === "string") {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          return getAttendanceDate(parsed);
        }
      }
      return String(value ?? "");
    };

    const attendanceByDate = new Map<string, any>();
    rows.forEach((row: any) => {
      attendanceByDate.set(normalizeAttendanceDate(row.date), {
        ...row,
        time_in: formatAttendanceTime(row.time_in),
        time_out: formatAttendanceTime(row.time_out),
      });
    });

    const formattedRows = [] as any[];
    const parseAttendanceDate = (value: string) =>
      new Date(`${value}T00:00:00+07:00`);
    let currentDate = parseAttendanceDate(start);
    const lastDate = parseAttendanceDate(end);

    while (currentDate <= lastDate) {
      const formattedDate = getAttendanceDate(currentDate);
      const row = attendanceByDate.get(formattedDate);

      if (row) {
        formattedRows.push({
          id: row.id,
          date: normalizeAttendanceDate(row.date),
          time_in: row.time_in || null,
          time_out: row.time_out || null,
          status: row.status || "Alpa",
          location:
            row.location_lat && row.location_lng
              ? `${row.location_lat}, ${row.location_lng}`
              : null,
        });
      } else {
        formattedRows.push({
          id: `${userId}-${formattedDate}`,
          date: formattedDate,
          time_in: null,
          time_out: null,
          status: "Alpa",
          location: null,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    formattedRows.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    res.json(formattedRows);
  } catch (error) {
    console.error("Error getting attendance history:", error);
    res.status(500).json({ message: "Gagal mengambil riwayat Presensi" });
  }
};

export const getStudentFaceStatus = async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const [rows]: any = await db.execute(
      "SELECT face_data FROM students WHERE user_id = ?",
      [userId],
    );
    res.json({ hasFace: !!(rows[0] && rows[0].face_data) });
  } catch (error) {
    console.error("Error getting face status:", error);
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

export const registerStudentFace = async (req: any, res: Response) => {
  const { faceDescriptor, faceImage } = req.body;
  const userId = req.user.id;

  try {
    const normalizedFaceImage = normalizeFaceImage(faceImage);

    await db.execute(
      "UPDATE students SET face_data = ?, face_image = ? WHERE user_id = ?",
      [JSON.stringify(faceDescriptor), normalizedFaceImage, userId],
    );

    res.json({ message: "Pendaftaran wajah berhasil" });
  } catch (error) {
    console.error("Error in registerStudentFace:", error);
    res.status(500).json({ message: "Gagal mendaftarkan wajah" });
  }
};

export const getStudentSchedule = async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const [rows]: any = await db.execute(
      `SELECT s.id, s.day, s.start_time, s.end_time, s.subject, 
              s.class_id, s.room, c.class_name, u.full_name as teacher_name
       FROM schedules s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN teachers t ON s.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE s.class_id = (SELECT class_id FROM students WHERE user_id = ?)
       ORDER BY FIELD(s.day, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'), s.start_time ASC`,
      [userId],
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
      teacher_name: row.teacher_name || "-",
    }));

    res.json(formattedSchedule);
  } catch (error) {
    console.error("Error getting student schedule:", error);
    res.status(500).json({ message: "Gagal mengambil jadwal" });
  }
};

/**
 * Get student profile
 */
export const getStudentProfile = async (req: any, res: Response) => {
  const userId = req.user.id;

  try {
    const [rows]: any = await db.execute(
      `SELECT u.id, u.full_name, u.username,
              s.nisn, s.class_id, c.class_name
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE u.id = ?`,
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Data siswa tidak ditemukan" });
    }

    const student = rows[0];
    res.json({
      id: student.id,
      fullName: student.full_name,
      username: student.username,
      nisn: student.nisn,
      classId: student.class_id,
      className: student.class_name || "-",
    });
  } catch (error) {
    console.error("Error getting student profile:", error);
    res.status(500).json({ message: "Gagal mengambil data profil siswa" });
  }
};

export const getMyPermits = async (req: any, res: Response) => {
  const userId = req.user.id;

  try {
    const [rows]: any = await db.execute(
      `SELECT id, permit_type, start_date, end_date, reason, 
              attachment_url, status, rejection_reason, created_at, updated_at
       FROM student_permits 
       WHERE student_id = ? 
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

export const createPermit = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { permit_type, start_date, end_date, reason, attachment_url } =
    req.body;

  const attachmentUrls = attachment_url ? attachment_url.split(",") : [];
  const fileCount = attachmentUrls.length;

  if (fileCount === 0) {
    let message = "";
    switch (permit_type) {
      case "sick":
        message = "Izin sakit wajib menyertakan lampiran surat dokter";
        break;
      case "leave":
        message = "Izin cuti/libur wajib menyertakan lampiran surat cuti";
        break;
      case "business":
        message =
          "Izin keperluan keluarga wajib menyertakan minimal 2 foto lampiran";
        break;
      case "remote":
        message =
          "Izin Belajar Dari Rumah wajib menyertakan minimal 2 foto dokumentasi";
        break;
      default:
        message = "Wajib menyertakan lampiran";
    }
    return res.status(400).json({ message });
  }

  if (
    (permit_type === "business" || permit_type === "remote") &&
    fileCount < 2
  ) {
    const message =
      permit_type === "business"
        ? "Izin keperluan keluarga wajib menyertakan minimal 2 foto lampiran"
        : "Izin Belajar Dari Rumah wajib menyertakan minimal 2 foto dokumentasi";
    return res.status(400).json({ message });
  }

  if (!permit_type || !start_date || !end_date || !reason) {
    return res.status(400).json({
      message: "Semua field wajib diisi",
    });
  }

  if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({
      message: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai",
    });
  }

  try {
    const [result]: any = await db.execute(
      `INSERT INTO student_permits 
       (student_id, permit_type, start_date, end_date, reason, attachment_url, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        permit_type,
        start_date,
        end_date,
        reason,
        attachment_url || null,
      ],
    );

    res.json({
      message: "Pengajuan izin berhasil dikirim",
      id: result.insertId,
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
      "SELECT id, status FROM student_permits WHERE id = ? AND student_id = ?",
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
      "DELETE FROM student_permits WHERE id = ? AND student_id = ?",
      [id, userId],
    );

    res.json({ message: "Pengajuan izin berhasil dibatalkan" });
  } catch (error) {
    console.error("Error in cancelPermit:", error);
    res.status(500).json({ message: "Gagal membatalkan pengajuan izin" });
  }
};

export const getStudentPermitDetail = async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [rows]: any = await db.execute(
      `SELECT id, permit_type, start_date, end_date, reason, 
              attachment_url, status, rejection_reason, created_at, updated_at
       FROM student_permits 
       WHERE id = ? AND student_id = ?`,
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
    console.error("Error in getStudentPermitDetail:", error);
    res.status(500).json({ message: "Gagal mengambil detail izin" });
  }
};
