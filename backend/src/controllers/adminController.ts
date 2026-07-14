/** @format */

import type { Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import db from "../config/database.js";
import bcrypt from "bcrypt";

interface AuthRequest extends Request {
  user?: string | JwtPayload;
}
interface DashboardStats {
  siswa: number;
  guru: number;
  orangtua: number;
  hadirHariIni: number;
  terlambatHariIni: number;
  terlambatSiswa: number;
  terlambatGuru: number;
  kehadiranRate: number;
  kehadiranChange?: number;
  siswaBaru?: number;
  guruBaru?: number;
}

interface RecentLog {
  time_in: string;
  full_name: string;
  role: string;
  status: string;
}

interface StudentRow {
  id: number;
  user_id: number;
  class_id: number;
  nisn: string;
  parent_id: number | null;
  face_data: string | null;
  full_name: string | null;
  username: string | null;
}

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [totalSiswaRows] = await db.execute(
      "SELECT COUNT(*) as count FROM students",
    );
    const totalSiswa = (totalSiswaRows as { count: number }[])[0]?.count || 0;

    const [totalGuruRows] = await db.execute(
      "SELECT COUNT(*) as count FROM teachers",
    );
    const totalGuru = (totalGuruRows as { count: number }[])[0]?.count || 0;

    const [totalOrangtuaRows] = await db.execute(
      "SELECT COUNT(*) as count FROM users WHERE role = 'orangtua'",
    );
    const totalOrangtua =
      (totalOrangtuaRows as { count: number }[])[0]?.count || 0;

    const totalUsers = totalSiswa + totalGuru;

    const requestedDateInput =
      typeof req.query.date === "string"
        ? req.query.date
        : new Date().toISOString().slice(0, 10);

    const requestedDateObj = new Date(requestedDateInput);
    const requestedDate = isNaN(requestedDateObj.getTime())
      ? new Date().toISOString().slice(0, 10)
      : requestedDateInput;

    const [attendanceRows] = await db.execute(
      `
      SELECT a.time_in, u.full_name, u.role, a.status
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.date = ?
      ORDER BY a.time_in DESC
    `,
      [requestedDate],
    );

    const attendanceToday = attendanceRows as RecentLog[];

    const [lateSiswaRows] = await db.execute(
      `SELECT COUNT(*) as count
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.date = ? AND u.role = 'siswa' AND a.status = 'Terlambat'`,
      [requestedDate],
    );
    const lateSiswaCount =
      (lateSiswaRows as { count: number }[])[0]?.count || 0;

    const [lateGuruRows] = await db.execute(
      `SELECT COUNT(*) as count
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.date = ? AND u.role = 'guru' AND a.status = 'Terlambat'`,
      [requestedDate],
    );
    const lateGuruCount = (lateGuruRows as { count: number }[])[0]?.count || 0;

    const lateCount = lateSiswaCount + lateGuruCount;
    const hadirCount = attendanceToday.length;

    const kehadiranRate =
      totalUsers > 0 ? Number(((hadirCount / totalUsers) * 100).toFixed(1)) : 0;

    const yesterday = new Date(requestedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const [yesterdayAttendanceRows] = await db.execute(
      `
      SELECT COUNT(*) as count
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.date = ?
    `,
      [yesterdayStr],
    );
    const yesterdayHadirCount =
      (yesterdayAttendanceRows as { count: number }[])[0]?.count || 0;
    const yesterdayKehadiranRate =
      totalUsers > 0
        ? Number(((yesterdayHadirCount / totalUsers) * 100).toFixed(1))
        : 0;

    const kehadiranChange = Number(
      (kehadiranRate - yesterdayKehadiranRate).toFixed(1),
    );

    const [newStudentsRows] = await db.execute(
      `
      SELECT COUNT(DISTINCT a.user_id) as count
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE u.role = 'siswa' AND a.date = ? AND a.user_id NOT IN (
        SELECT user_id FROM attendance WHERE date = ?
      )
    `,
      [requestedDate, yesterdayStr],
    );
    const siswaBaru = (newStudentsRows as { count: number }[])[0]?.count || 0;
    const guruBaru = 0;
    const stats: DashboardStats = {
      siswa: totalSiswa,
      guru: totalGuru,
      orangtua: totalOrangtua,
      hadirHariIni: hadirCount,
      terlambatHariIni: lateCount,
      terlambatSiswa: lateSiswaCount,
      terlambatGuru: lateGuruCount,
      kehadiranRate,
      kehadiranChange,
      siswaBaru,
      guruBaru,
    };

    res.json({
      stats,
      recentLogs: attendanceToday,
      tanggal: requestedDate,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Gagal mengambil data dashboard" });
  }
};

export const getStudents = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.execute(`
      SELECT s.id, u.full_name, u.username, s.nisn, s.face_data, c.class_name, s.class_id
      FROM users u
      JOIN students s ON u.id = s.user_id
      JOIN classes c ON s.class_id = c.id
      WHERE u.role = 'siswa'
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Gagal mengambil data siswa" });
  }
};

export const getClasses = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.execute(`SELECT id, class_name FROM classes`);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ message: "Gagal mengambil data kelas" });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  const { username, password, full_name, nisn, class_id } = req.body;
  const connection = await db.getConnection();

  if (!username || !password || !full_name || !nisn || !class_id) {
    return res.status(400).json({
      message: "username, password, full_name, nisn, dan class_id wajib diisi",
    });
  }

  try {
    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult]: any = await connection.execute(
      'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, "siswa")',
      [username, hashedPassword, full_name],
    );

    const [studentResult]: any = await connection.execute(
      "INSERT INTO students (user_id, nisn, class_id) VALUES (?, ?, ?)",
      [userResult.insertId, nisn, class_id],
    );

    await connection.commit();
    res.json({
      message: "Siswa berhasil ditambahkan",
      id: studentResult.insertId,
      plaintext_password: password,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Error creating student:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Username sudah terdaftar" });
    }

    res.status(500).json({ message: "Gagal menambahkan siswa" });
  } finally {
    connection.release();
  }
};
export const updateStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { full_name, username, password, nisn, class_id } = req.body;

  if (!full_name || !username || !nisn || !class_id) {
    return res.status(400).json({
      message: "full_name, username, nisn, dan class_id wajib diisi",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [studentRows]: any = await connection.execute(
      `SELECT user_id FROM students WHERE id = ?`,
      [Number(id)],
    );

    if ((studentRows as any[]).length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    }

    const userId = (studentRows as any[])[0].user_id;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await connection.execute(
        `UPDATE users SET username = ?, full_name = ?, password = ? WHERE id = ?`,
        [username, full_name, hashedPassword, userId],
      );
    } else {
      await connection.execute(
        `UPDATE users SET username = ?, full_name = ? WHERE id = ?`,
        [username, full_name, userId],
      );
    }

    await connection.execute(
      `UPDATE students SET nisn = ?, class_id = ? WHERE id = ?`,
      [nisn, class_id, Number(id)],
    );

    await connection.commit();

    const [rows] = await db.execute(
      `
      SELECT s.id, s.user_id, s.class_id, s.nisn, s.parent_id, s.face_data,
             u.full_name, u.username
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
      `,
      [Number(id)],
    );

    const result = (rows as StudentRow[])[0];
    if (password) {
      (result as any).plaintext_password = password;
    }
    res.json(result);
  } catch (error) {
    await connection.rollback();
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Gagal memperbarui data siswa" });
  } finally {
    connection.release();
  }
};

export const deleteAllStudents = async (req: Request, res: Response) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [studentRows]: any = await connection.execute(`
      SELECT s.id, s.user_id
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE u.role = 'siswa'
    `);

    if ((studentRows as any[]).length === 0) {
      await connection.rollback();
      return res.status(200).json({
        message: "Tidak ada siswa untuk dihapus",
        deletedCount: 0,
      });
    }

    for (const student of studentRows as any[]) {
      const studentId = Number(student.id);
      const userId = student.user_id;

      const [parentRows]: any = await connection.execute(
        `SELECT user_id FROM parents WHERE student_id = ?`,
        [studentId],
      );

      for (const parent of parentRows) {
        await connection.execute(`DELETE FROM parents WHERE user_id = ?`, [
          parent.user_id,
        ]);
        await connection.execute(`DELETE FROM users WHERE id = ?`, [
          parent.user_id,
        ]);
      }

      if (userId) {
        await connection.execute(`DELETE FROM attendance WHERE user_id = ?`, [
          userId,
        ]);
        await connection.execute(`DELETE FROM students WHERE id = ?`, [
          studentId,
        ]);
        await connection.execute(`DELETE FROM users WHERE id = ?`, [userId]);
      }
    }

    await connection.commit();
    res.status(200).json({
      message: `Berhasil menghapus ${studentRows.length} siswa`,
      deletedCount: studentRows.length,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting all students:", error);
    res.status(500).json({ message: "Gagal menghapus semua siswa" });
  } finally {
    connection.release();
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [studentRows]: any = await connection.execute(
      `SELECT user_id FROM students WHERE id = ?`,
      [Number(id)],
    );

    if ((studentRows as any[]).length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    }

    const userId = (studentRows as any[])[0].user_id;

    const [parentRows]: any = await connection.execute(
      `SELECT user_id FROM parents WHERE student_id = ?`,
      [Number(id)],
    );

    for (const parent of parentRows) {
      await connection.execute(`DELETE FROM parents WHERE user_id = ?`, [
        parent.user_id,
      ]);
      await connection.execute(`DELETE FROM users WHERE id = ?`, [
        parent.user_id,
      ]);
    }

    await connection.execute(`DELETE FROM attendance WHERE user_id = ?`, [
      userId,
    ]);

    await connection.execute(`DELETE FROM students WHERE id = ?`, [Number(id)]);

    await connection.execute(`DELETE FROM users WHERE id = ?`, [userId]);

    await connection.commit();
    res.status(204).end();
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Gagal menghapus siswa" });
  } finally {
    connection.release();
  }
};

export const getAllTeachers = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.execute(`
      SELECT 
        t.id,
        u.id AS user_id,
        u.full_name,
        u.username,
        t.nip,
        t.face_data,
        (SELECT COUNT(*) FROM schedules WHERE teacher_id = t.id) as total_schedules
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      WHERE u.role = 'guru'
      ORDER BY u.full_name ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Gagal mengambil data guru" });
  }
};

export const addTeacher = async (req: Request, res: Response) => {
  const { username, password, full_name, nip } = req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult]: any = await connection.execute(
      'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, "guru")',
      [username, hashedPassword, full_name],
    );

    await connection.execute(
      "INSERT INTO teachers (user_id, nip) VALUES (?, ?)",
      [userResult.insertId, nip],
    );

    await connection.commit();
    res.json({
      message: "Guru berhasil ditambahkan",
      plaintext_password: password,
      id: userResult.insertId,
    });
  } catch (error: any) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Username atau NIP sudah digunakan" });
    }
    res.status(500).json({ message: "Gagal menambahkan data guru" });
  } finally {
    connection.release();
  }
};

export const updateTeacher = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { full_name, username, password, nip } = req.body;

  if (!full_name) {
    return res.status(400).json({
      message: "full_name wajib diisi",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [teacherRows]: any = await connection.execute(
      `SELECT user_id FROM teachers WHERE id = ?`,
      [Number(id)],
    );

    if ((teacherRows as any[]).length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Guru tidak ditemukan" });
    }

    const userId = (teacherRows as any[])[0].user_id;

    let updateUserQuery = `UPDATE users SET full_name = ?`;
    const userParams: any[] = [full_name];

    if (username) {
      updateUserQuery += `, username = ?`;
      userParams.push(username);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateUserQuery += `, password = ?`;
      userParams.push(hashedPassword);
    }

    updateUserQuery += ` WHERE id = ?`;
    userParams.push(userId);

    await connection.execute(updateUserQuery, userParams);

    if (nip) {
      await connection.execute(`UPDATE teachers SET nip = ? WHERE id = ?`, [
        nip,
        Number(id),
      ]);
    }

    await connection.commit();

    const [rows] = await db.execute(
      `
      SELECT t.id, t.user_id, t.nip, t.face_data,
             u.full_name, u.username
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
      `,
      [Number(id)],
    );

    res.json({
      ...(rows as any[])[0],
      plaintext_password: password || undefined,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Error updating teacher:", error);

    if (error.code === "ER_DUP_ENTRY") {
      if (error.message.includes("username")) {
        return res.status(400).json({
          message: "Username sudah digunakan oleh guru lain",
        });
      } else if (error.message.includes("nip")) {
        return res.status(400).json({
          message: "NIP sudah digunakan oleh guru lain",
        });
      }
    }

    res.status(500).json({ message: "Gagal memperbarui data guru" });
  } finally {
    connection.release();
  }
};

export const deleteAllTeachers = async (req: Request, res: Response) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [TeacherRows]: any = await connection.execute(`
      SELECT t.id, t.user_id
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE u.role = 'guru'
    `);

    if ((TeacherRows as any[]).length === 0) {
      await connection.rollback();
      return res.status(200).json({
        message: "Tidak ada guru untuk dihapus",
        deletedCount: 0,
      });
    }

    for (const teacher of TeacherRows as any[]) {
      const teacherId = Number(teacher.id);
      const userId = teacher.user_id;

      if (userId) {
        await connection.execute(`DELETE FROM attendance WHERE user_id = ?`, [
          userId,
        ]);
        await connection.execute(`DELETE FROM schedules WHERE teacher_id = ?`, [
          teacherId,
        ]);
        await connection.execute(
          `DELETE FROM announcements WHERE teacher_id = ?`,
          [userId],
        );
        await connection.execute(
          `DELETE FROM teacher_permits WHERE teacher_id = ?`,
          [userId],
        );
        await connection.execute(
          `UPDATE classes SET homeroom_teacher_id = NULL WHERE homeroom_teacher_id = ?`,
          [teacherId],
        );
        await connection.execute(`DELETE FROM teachers WHERE id = ?`, [
          teacherId,
        ]);
        await connection.execute(`DELETE FROM users WHERE id = ?`, [userId]);
      }
    }

    await connection.commit();
    res.status(200).json({
      message: `Berhasil menghapus ${TeacherRows.length} guru`,
      deletedCount: TeacherRows.length,
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Error deleting all teachers:", error);
    res.status(500).json({
      message: "Gagal menghapus semua guru",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

export const deleteTeacher = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = Number(id);

  if (!userId) {
    return res.status(400).json({ message: "ID tidak valid" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [userRows]: any = await connection.execute(
      "SELECT id, role FROM users WHERE id = ?",
      [userId],
    );

    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    if (userRows[0].role !== "guru") {
      await connection.rollback();
      return res.status(400).json({ message: "User bukan guru" });
    }

    const [teacherRows]: any = await connection.execute(
      "SELECT id FROM teachers WHERE user_id = ?",
      [userId],
    );

    if (teacherRows.length > 0) {
      const teacherId = teacherRows[0].id;

      await connection.execute("DELETE FROM schedules WHERE teacher_id = ?", [
        teacherId,
      ]);

      await connection.execute(
        "DELETE FROM announcements WHERE teacher_id = ?",
        [userId],
      );

      await connection.execute("DELETE FROM attendance WHERE user_id = ?", [
        userId,
      ]);

      await connection.execute("DELETE FROM teachers WHERE user_id = ?", [
        userId,
      ]);
    }

    await connection.execute("DELETE FROM users WHERE id = ?", [userId]);

    await connection.commit();
    res.json({ message: "Data guru berhasil dihapus" });
  } catch (error: any) {
    await connection.rollback();
    console.error("Error deleting teacher:", error);
    res.status(500).json({
      message: "Gagal menghapus data guru",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

export const getAllClasses = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.execute(
      `SELECT 
        c.id,
        c.class_name,
        c.major,
        c.homeroom_teacher_id,
        u.full_name as homeroom_teacher_name,
        t.nip as teacher_nip
       FROM classes c
       LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       ORDER BY 
         FIELD(c.major, 'Teknik Sepeda Motor', 'Perhotelan', 'Manajemen Perkantoran'),
         c.class_name ASC`,
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ message: "Gagal mengambil data kelas" });
  }
};

export const addClass = async (req: Request, res: Response) => {
  const { class_name, major, homeroom_teacher_id } = req.body;

  if (!class_name || !major) {
    return res.status(400).json({
      message: "Nama kelas dan jurusan wajib diisi",
    });
  }

  try {
    const [result]: any = await db.execute(
      "INSERT INTO classes (class_name, major, homeroom_teacher_id) VALUES (?, ?, ?)",
      [class_name, major, homeroom_teacher_id || null],
    );

    const [newClass]: any = await db.execute(
      `SELECT 
        c.id,
        c.class_name,
        c.major,
        c.homeroom_teacher_id,
        u.full_name as homeroom_teacher_name,
        t.nip as teacher_nip
       FROM classes c
       LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId],
    );

    res.json({
      message: "Kelas berhasil ditambahkan",
      data: newClass[0] || null,
    });
  } catch (error: any) {
    console.error("Error adding class:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Nama kelas sudah terdaftar" });
    }
    res.status(500).json({ message: "Gagal menambahkan kelas" });
  }
};

export const updateClass = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { class_name, major, homeroom_teacher_id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "ID kelas wajib diisi" });
  }

  if (!class_name && !major && homeroom_teacher_id === undefined) {
    return res.status(400).json({
      message: "Minimal satu field yang akan diupdate",
    });
  }

  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (class_name) {
      updates.push("class_name = ?");
      values.push(class_name);
    }
    if (major) {
      updates.push("major = ?");
      values.push(major);
    }
    if (homeroom_teacher_id !== undefined) {
      updates.push("homeroom_teacher_id = ?");
      values.push(homeroom_teacher_id === "" ? null : homeroom_teacher_id);
    }

    values.push(Number(id));

    await db.execute(
      `UPDATE classes SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    const [updatedClass]: any = await db.execute(
      `SELECT 
        c.id,
        c.class_name,
        c.major,
        c.homeroom_teacher_id,
        u.full_name as homeroom_teacher_name,
        t.nip as teacher_nip
       FROM classes c
       LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE c.id = ?`,
      [id],
    );

    res.json({
      message: "Kelas berhasil diperbarui",
      data: updatedClass[0] || null,
    });
  } catch (error: any) {
    console.error("Error updating class:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Nama kelas sudah terdaftar" });
    }
    res.status(500).json({ message: "Gagal memperbarui kelas" });
  }
};

export const deleteClass = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID kelas wajib diisi" });
  }

  try {
    const [students]: any = await db.execute(
      "SELECT COUNT(*) as count FROM students WHERE class_id = ?",
      [Number(id)],
    );

    if (students[0].count > 0) {
      return res.status(400).json({
        message: `Tidak dapat menghapus kelas karena masih memiliki ${students[0].count} siswa`,
        hasStudents: true,
        studentCount: students[0].count,
      });
    }

    const [schedules]: any = await db.execute(
      "SELECT COUNT(*) as count FROM schedules WHERE class_id = ?",
      [Number(id)],
    );

    if (schedules[0].count > 0) {
      return res.status(400).json({
        message: `Tidak dapat menghapus kelas karena masih memiliki ${schedules[0].count} jadwal pelajaran`,
        hasSchedules: true,
        scheduleCount: schedules[0].count,
      });
    }

    await db.execute("DELETE FROM classes WHERE id = ?", [Number(id)]);
    res.json({ message: "Kelas berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({
      message:
        "Gagal menghapus kelas. Pastikan tidak ada data terkait di kelas ini.",
    });
  }
};

export const getClassDetail = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID kelas wajib diisi" });
  }

  try {
    const [rows]: any = await db.execute(
      `SELECT 
        c.id,
        c.class_name,
        c.major,
        c.homeroom_teacher_id,
        u.full_name as homeroom_teacher_name,
        t.nip as teacher_nip,
        (SELECT COUNT(*) FROM students WHERE class_id = c.id) as total_students,
        (SELECT COUNT(*) FROM schedules WHERE class_id = c.id) as total_schedules
       FROM classes c
       LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE c.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Kelas tidak ditemukan" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching class detail:", error);
    res.status(500).json({ message: "Gagal mengambil detail kelas" });
  }
};

export const getMajors = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.execute(`
      SELECT DISTINCT major 
      FROM classes
      ORDER BY major ASC
    `);
    const majors = rows.map((row: any) => row.major);
    res.json(majors);
  } catch (error) {
    console.error("Error fetching majors:", error);
    res.status(500).json({ message: "Gagal mengambil data jurusan" });
  }
};

export const getAttendanceReport = async (req: Request, res: Response) => {
  const dateRaw = req.query.date;
  const startDateRaw = req.query.startDate;
  const endDateRaw = req.query.endDate;
  const roleRaw = req.query.role;
  const classIdRaw = req.query.class_id;

  let startDate: string;
  let endDate: string;

  if (typeof dateRaw === "string") {
    startDate = dateRaw;
    endDate = dateRaw;
  } else {
    startDate =
      typeof startDateRaw === "string"
        ? startDateRaw
        : new Date().toISOString().slice(0, 10);
    endDate =
      typeof endDateRaw === "string"
        ? endDateRaw
        : new Date().toISOString().slice(0, 10);
  }

  const role = typeof roleRaw === "string" ? roleRaw : null;
  const classId = typeof classIdRaw === "string" ? classIdRaw : null;

  try {
    let query = `
      SELECT 
        a.id, 
        u.full_name, 
        u.role, 
        c.class_name, 
        a.date, 
        a.time_in, 
        a.time_out,
        a.status,
        a.location_lat,
        a.location_lng
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE a.date BETWEEN ? AND ?
    `;

    const params: any[] = [startDate, endDate];

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (classId) {
      query += ` AND s.class_id = ?`;
      params.push(classId);
    }

    query += ` ORDER BY a.date DESC, a.time_in DESC`;

    const [rows]: any = await db.execute(query, params);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil laporan absensi" });
  }
};

export const getBiometricStatus = async (req: Request, res: Response) => {
  try {
    const [rows] = await db.execute<any[]>(`
      SELECT u.id as user_id, u.full_name, u.role,
      (CASE 
        WHEN u.role = 'siswa' AND s.face_data IS NOT NULL THEN 1 
        WHEN u.role = 'guru' AND t.face_data IS NOT NULL THEN 1 
        ELSE 0 
      END) as has_face,
      (CASE 
        WHEN u.role = 'siswa' THEN s.face_image
        WHEN u.role = 'guru' THEN t.face_image
        ELSE NULL
      END) as face_image
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE u.role IN ('siswa', 'guru')
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error data biometrik" });
  }
};

export const resetFace = async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);
  if (!userId) {
    return res.status(400).json({ message: "userId wajib diisi" });
  }

  try {
    await db.execute("UPDATE students SET face_data = NULL WHERE user_id = ?", [
      userId,
    ]);
    await db.execute("UPDATE teachers SET face_data = NULL WHERE user_id = ?", [
      userId,
    ]);
    res.json({ message: "Berhasil reset wajah" });
  } catch (error) {
    res.status(500).json({ message: "Gagal reset wajah" });
  }
};

export const deleteFace = async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);
  if (!userId) {
    return res.status(400).json({ message: "userId wajib diisi" });
  }

  try {
    await db.execute(
      "UPDATE students SET face_data = NULL, face_image = NULL WHERE user_id = ?",
      [userId],
    );
    await db.execute(
      "UPDATE teachers SET face_data = NULL, face_image = NULL WHERE user_id = ?",
      [userId],
    );
    res.json({ message: "Berhasil hapus data biometrik" });
  } catch (error) {
    res.status(500).json({ message: "Gagal hapus data biometrik" });
  }
};

export const addFaceImageColumns = async (req: Request, res: Response) => {
  try {
    await db.execute("ALTER TABLE students ADD COLUMN face_image TEXT");
    await db.execute("ALTER TABLE teachers ADD COLUMN face_image TEXT");

    res.json({ message: "Columns added successfully!" });
  } catch (error) {
    console.error("Error adding columns:", error);
    res
      .status(500)
      .json({ message: "Error adding columns", error: String(error) });
  }
};

export const getAllParents = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.execute(`
      SELECT u.id, u.full_name, u.username, COALESCE(p.phone, '') as phone, us.full_name as student_name, p.student_id
      FROM users u
      JOIN parents p ON u.id = p.user_id
      LEFT JOIN students s ON p.student_id = s.id
      LEFT JOIN users us ON s.user_id = us.id
      WHERE u.role = 'orangtua'
    `);
    res.json(rows);
  } catch (error: any) {
    const errorMessage = error?.sqlMessage || error?.message || String(error);
    console.error("SQL Error:", errorMessage);
    res.status(500).json({
      message: "Gagal mengambil data orang tua",
      sqlError: errorMessage,
    });
  }
};

export const addParent = async (req: Request, res: Response) => {
  const { username, password, full_name, phone, student_id } = req.body;

  if (!username || !password || !full_name || !phone || !student_id) {
    return res.status(400).json({
      message:
        "username, password, full_name, phone, dan student_id wajib diisi",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [studentRows]: any = await connection.execute(
      "SELECT id FROM students WHERE id = ?",
      [student_id],
    );

    if (studentRows.length === 0) {
      return res.status(400).json({
        message: "Student ID tidak ditemukan. Pastikan siswa sudah terdaftar.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult]: any = await connection.execute(
      'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, "orangtua")',
      [username, hashedPassword, full_name],
    );

    await connection.execute(
      "INSERT INTO parents (user_id, phone, student_id) VALUES (?, ?, ?)",
      [userResult.insertId, phone, student_id],
    );

    await connection.commit();
    res.json({
      message: "Data orang tua berhasil ditambahkan",
      plaintext_password: password,
      id: userResult.insertId,
    });
  } catch (error: any) {
    await connection.rollback();

    console.error("Error adding parent:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Username sudah terdaftar" });
    }

    res.status(500).json({ message: "Gagal menambahkan data orang tua" });
  } finally {
    connection.release();
  }
};

export const updateParent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, full_name, phone, student_id, password } = req.body;

  if (!username || !full_name || !phone || !student_id) {
    return res.status(400).json({
      message: "username, full_name, phone, dan student_id wajib diisi",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let updateUserQuery = "UPDATE users SET username = ?, full_name = ?";
    let params: any[] = [username, full_name];

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          message: "Password minimal 6 karakter",
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateUserQuery += ", password = ?";
      params.push(hashedPassword);
    }

    updateUserQuery += " WHERE id = ?";
    params.push(id);

    await connection.execute(updateUserQuery, params);

    await connection.execute(
      "UPDATE parents SET phone = ?, student_id = ? WHERE user_id = ?",
      [phone, student_id, id],
    );

    await connection.commit();
    res.json({
      message: "Data orang tua berhasil diperbarui",
      plaintext_password: password || undefined,
    });
  } catch (error: any) {
    await connection.rollback();

    console.error("Error updating parent:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Username sudah terdaftar" });
    }

    res.status(500).json({ message: "Gagal memperbarui data orang tua" });
  } finally {
    connection.release();
  }
};

export const deleteParent = async (req: Request, res: Response) => {
  const idParam = req.params.id;
  const userId = Number(idParam);

  if (!userId) {
    return res.status(400).json({ message: "ID orang tua wajib diisi" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute("DELETE FROM parents WHERE user_id = ?", [userId]);
    await connection.execute("DELETE FROM users WHERE id = ?", [userId]);
    await connection.commit();
    res.json({ message: "Data orang tua berhasil dihapus" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: "Gagal menghapus data orang tua" });
  } finally {
    connection.release();
  }
};

export const getAllSchedules = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.execute(
      `SELECT s.id, s.day, s.start_time, s.end_time, s.subject, 
              s.class_id, s.room, s.teacher_id, s.attachment, c.class_name, u.full_name as teacher_name
       FROM schedules s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN teachers t ON s.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       ORDER BY FIELD(s.day, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'), s.start_time ASC`,
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
      teacher_id: row.teacher_id,
      teacher_name: row.teacher_name || "-",
      attachment: row.attachment || null,
    }));

    res.json(formattedSchedule);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil jadwal mengajar" });
  }
};

export const createSchedule = async (req: AuthRequest, res: Response) => {
  const { day, start_time, end_time, subject, class_id, room, teacher_id } =
    req.body;

  try {
    if (
      !day ||
      !start_time ||
      !end_time ||
      !subject ||
      !class_id ||
      !teacher_id
    ) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    const result = await db.execute(
      `INSERT INTO schedules (day, start_time, end_time, subject, class_id, room, teacher_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [day, start_time, end_time, subject, class_id, room || null, teacher_id],
    );

    const scheduleId = (result[0] as any).insertId;

    res.json({ message: "Jadwal berhasil ditambahkan", scheduleId });
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({ message: "Gagal menambahkan jadwal" });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    day,
    start_time,
    end_time,
    subject,
    class_id,
    room,
    teacher_id,
    attachment,
  } = req.body;

  try {
    if (
      !day ||
      !start_time ||
      !end_time ||
      !subject ||
      !class_id ||
      !teacher_id
    ) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    await db.execute(
      `UPDATE schedules
       SET day = ?, start_time = ?, end_time = ?, subject = ?, class_id = ?, room = ?, teacher_id = ?, attachment = ?
       WHERE id = ?`,
      [
        day,
        start_time,
        end_time,
        subject,
        class_id,
        room || null,
        teacher_id,
        attachment || null,
        id,
      ],
    );

    res.json({ message: "Jadwal berhasil diupdate" });
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({ message: "Gagal mengupdate jadwal" });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: "ID jadwal tidak valid" });
  }

  try {
    const scheduleId = parseInt(id);
    if (isNaN(scheduleId)) {
      return res.status(400).json({ message: "ID jadwal tidak valid" });
    }

    await db.execute("DELETE FROM schedules WHERE id = ?", [scheduleId]);
    res.json({ message: "Jadwal berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ message: "Gagal menghapus jadwal" });
  }
};

export const getAttendanceTrends = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const weekDates = [];
    const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum"];

    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date.toISOString().slice(0, 10));
    }

    const trends = [];

    for (let i = 0; i < weekDates.length; i++) {
      const date = weekDates[i];

      const [totalUsersRows] = await db.execute(
        "SELECT COUNT(*) as count FROM users WHERE role IN ('siswa', 'guru')",
      );
      const totalUsers = (totalUsersRows as { count: number }[])[0]?.count || 0;

      const [attendanceRows] = await db.execute(
        "SELECT COUNT(*) as count FROM attendance WHERE date = ?",
        [date as string],
      );
      const attendanceCount =
        (attendanceRows as { count: number }[])[0]?.count || 0;

      const rate =
        totalUsers > 0
          ? Number(((attendanceCount / totalUsers) * 100).toFixed(1))
          : 0;

      trends.push({
        label: dayLabels[i],
        value: rate,
      });
    }

    res.json(trends);
  } catch (error) {
    console.error("Error fetching attendance trends:", error);
    res.status(500).json({ message: "Gagal mengambil data tren kehadiran" });
  }
};

export const getLatenessByMajor = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [rows] = await db.execute(
      `SELECT c.major, COUNT(a.id) as count
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       JOIN students s ON u.id = s.user_id
       JOIN classes c ON s.class_id = c.id
       WHERE a.date = ? AND a.status IN ('Terlambat', 'terlambat') AND u.role = 'siswa'
       GROUP BY c.major
       ORDER BY count DESC`,
      [today],
    );

    const latenessData = (rows as { major: string; count: number }[]).map(
      (row) => ({
        type: row.major,
        value: row.count,
      }),
    );

    res.json(latenessData);
  } catch (error) {
    console.error("Error fetching lateness by major:", error);
    res
      .status(500)
      .json({ message: "Gagal mengambil data keterlambatan per jurusan" });
  }
};

export const getTeacherPermits = async (req: any, res: Response) => {
  try {
    const [rows]: any = await db.execute(
      `SELECT 
        tp.id,
        tp.teacher_id,
        tp.permit_type,
        tp.start_date,
        tp.end_date,
        tp.reason,
        tp.attachment_url,
        tp.status,
        tp.rejection_reason,
        tp.created_at,
        tp.updated_at,
        u.full_name as teacher_name,
        t.nip
       FROM teacher_permits tp
       JOIN users u ON tp.teacher_id = u.id
       JOIN teachers t ON tp.teacher_id = t.user_id
       ORDER BY 
         FIELD(tp.status, 'pending', 'approved', 'rejected'),
         tp.created_at DESC`,
    );

    const formattedPermits = rows.map((permit: any) => ({
      id: permit.id,
      teacherId: permit.teacher_id,
      teacherName: permit.teacher_name,
      nip: permit.nip,
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
    console.error("Error in getTeacherPermits:", error);
    res.status(500).json({ message: "Gagal mengambil data izin guru" });
  }
};

export const approveTeacherPermit = async (req: any, res: Response) => {
  const { id } = req.params;
  const adminName = req.user.full_name || "Admin";

  try {
    await db.execute(
      `UPDATE teacher_permits 
       SET status = 'approved', approved_by = ?, approved_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [adminName, id],
    );

    res.json({ message: "Izin guru berhasil disetujui" });
  } catch (error) {
    console.error("Error in approveTeacherPermit:", error);
    res.status(500).json({ message: "Gagal menyetujui izin" });
  }
};

export const rejectTeacherPermit = async (req: any, res: Response) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;
  const adminName = req.user.full_name || "Admin";

  if (!rejection_reason) {
    return res.status(400).json({ message: "Alasan penolakan harus diisi" });
  }

  try {
    await db.execute(
      `UPDATE teacher_permits 
       SET status = 'rejected', rejection_reason = ?, approved_by = ?, approved_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [rejection_reason, adminName, id],
    );

    res.json({ message: "Izin guru ditolak" });
  } catch (error) {
    console.error("Error in rejectTeacherPermit:", error);
    res.status(500).json({ message: "Gagal menolak izin" });
  }
};

export const getTeachersList = async (req: any, res: Response) => {
  try {
    const [rows]: any = await db.execute(
      `SELECT t.id, u.full_name as name
       FROM teachers t
       JOIN users u ON t.user_id = u.id
       ORDER BY u.full_name`,
    );
    res.json(rows);
  } catch (error) {
    console.error("Error in getTeachersList:", error);
    res.status(500).json({ message: "Gagal mengambil data guru" });
  }
};

const getPermitTypeLabel = (permitType: string): string => {
  const labels: { [key: string]: string } = {
    sakit: "Sakit",
    cuti: "Cuti",
    izin: "Izin",
    dinas: "Dinas",
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

export const debugGetAllAnnouncements = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.execute(
      `SELECT 
        a.id,
        a.title,
        a.content,
        a.teacher_id,
        a.class_id,
        u.full_name as teacher_name,
        c.class_name,
        a.created_at,
        a.updated_at
       FROM announcements a
       LEFT JOIN teachers t ON a.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN classes c ON a.class_id = c.id
       ORDER BY a.created_at DESC`,
    );

    const [studentClasses]: any = await db.execute(
      `SELECT u.id as user_id, u.full_name, s.class_id, c.class_name
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE u.role = 'siswa'`,
    );

    res.json({
      announcements: rows,
      studentClassMapping: studentClasses,
      summary: {
        totalAnnouncements: rows.length,
        totalStudents: studentClasses.length,
        announcementsWithNullClass: rows.filter((a: any) => a.class_id === null)
          .length,
      },
    });
  } catch (error) {
    console.error("Error in debugGetAllAnnouncements:", error);
    res.status(500).json({ message: "Gagal mengambil data debug pengumuman" });
  }
};

export const importStudents = async (req: Request, res: Response) => {
  const { students } = req.body;

  if (!students || !Array.isArray(students) || students.length === 0) {
    return res.status(400).json({
      message: "Data siswa tidak valid atau kosong",
    });
  }

  const connection = await db.getConnection();
  const results = {
    success: [] as any[],
    failed: [] as Array<{ row: number; data: any; error: string }>,
    total: students.length,
    successCount: 0,
    failedCount: 0,
  };

  try {
    await connection.beginTransaction();

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const { nisn, full_name, class_id, username, password } = student;

      try {
        if (!nisn || !full_name || !class_id) {
          throw new Error("NISN, Nama Lengkap, dan Kelas wajib diisi");
        }

        const [existingNISN]: any = await connection.execute(
          "SELECT id FROM students WHERE nisn = ?",
          [nisn],
        );

        if (existingNISN.length > 0) {
          throw new Error(`NISN ${nisn} sudah terdaftar`);
        }

        const [existingUsername]: any = await connection.execute(
          "SELECT id FROM users WHERE username = ?",
          [username],
        );

        if (existingUsername.length > 0) {
          throw new Error(`Username ${username} sudah digunakan`);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [userResult]: any = await connection.execute(
          'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, "siswa")',
          [username, hashedPassword, full_name],
        );

        const [studentResult]: any = await connection.execute(
          "INSERT INTO students (user_id, nisn, class_id) VALUES (?, ?, ?)",
          [userResult.insertId, nisn, class_id],
        );

        const [classResult]: any = await connection.execute(
          "SELECT class_name FROM classes WHERE id = ?",
          [class_id],
        );

        results.success.push({
          id: studentResult.insertId,
          nisn,
          full_name,
          username,
          class_id,
          class_name: classResult[0]?.class_name || "",
          plaintext_password: password,
        });

        results.successCount++;
      } catch (error: any) {
        results.failed.push({
          row: i + 1,
          data: student,
          error: error.message || "Gagal mengimport data",
        });
        results.failedCount++;
      }
    }

    await connection.commit();

    res.json({
      ...results,
      message: `Berhasil import ${results.successCount} dari ${results.total} siswa`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error importing students:", error);
    res.status(500).json({
      message: "Gagal mengimport data siswa",
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    connection.release();
  }
};

export const importTeachers = async (req: Request, res: Response) => {
  const { teachers } = req.body;

  if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
    return res.status(400).json({
      message: "Data guru tidak valid atau kosong",
    });
  }

  const connection = await db.getConnection();
  const results = {
    success: [] as any[],
    failed: [] as Array<{ row: number; data: any; error: string }>,
    total: teachers.length,
    successCount: 0,
    failedCount: 0,
  };

  try {
    await connection.beginTransaction();

    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      const { nip, full_name, username, password } = teacher;

      try {
        if (!nip || !full_name || !username || !password) {
          throw new Error(
            "NIP, Nama Lengkap, Username, dan Password wajib diisi",
          );
        }

        const [existingNIP]: any = await connection.execute(
          "SELECT id FROM teachers WHERE nip = ?",
          [nip],
        );

        if (existingNIP.length > 0) {
          throw new Error(`NIP ${nip} sudah terdaftar`);
        }

        const [existingUsername]: any = await connection.execute(
          "SELECT id FROM users WHERE username = ?",
          [username],
        );

        if (existingUsername.length > 0) {
          throw new Error(`Username ${username} sudah digunakan`);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [userResult]: any = await connection.execute(
          'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, "guru")',
          [username, hashedPassword, full_name],
        );

        const [teacherResult]: any = await connection.execute(
          "INSERT INTO teachers (user_id, nip) VALUES (?, ?)",
          [userResult.insertId, nip],
        );

        results.success.push({
          id: teacherResult.insertId,
          user_id: userResult.insertId,
          nip,
          full_name,
          username,
          plaintext_password: password,
        });

        results.successCount++;
      } catch (error: any) {
        results.failed.push({
          row: i + 1,
          data: teacher,
          error: error.message || "Gagal mengimport data",
        });
        results.failedCount++;
      }
    }

    await connection.commit();

    res.json({
      ...results,
      message: `Berhasil import ${results.successCount} dari ${results.total} guru`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error importing teachers:", error);
    res.status(500).json({
      message: "Gagal mengimport data guru",
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    connection.release();
  }
};

export const importSchedules = async (req: Request, res: Response) => {
  const { schedules } = req.body;

  if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
    return res.status(400).json({
      message: "Data jadwal tidak valid atau kosong",
    });
  }

  const connection = await db.getConnection();
  const results = {
    success: [] as any[],
    failed: [] as Array<{ row: number; data: any; error: string }>,
    total: schedules.length,
    successCount: 0,
    failedCount: 0,
  };

  try {
    await connection.beginTransaction();

    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i];
      const { day, start_time, end_time, subject, class_id, room, teacher_id } =
        schedule;

      try {
        if (
          !day ||
          !start_time ||
          !end_time ||
          !subject ||
          !class_id ||
          !teacher_id
        ) {
          throw new Error(
            "Hari, jam, mata pelajaran, kelas, dan guru wajib diisi",
          );
        }

        const [classCheck]: any = await connection.execute(
          "SELECT id FROM classes WHERE id = ?",
          [class_id],
        );
        if (classCheck.length === 0) {
          throw new Error(`Kelas dengan id ${class_id} tidak ditemukan`);
        }

        const [teacherCheck]: any = await connection.execute(
          "SELECT id FROM teachers WHERE id = ?",
          [teacher_id],
        );
        if (teacherCheck.length === 0) {
          throw new Error(`Guru dengan id ${teacher_id} tidak ditemukan`);
        }

        await connection.execute(
          `INSERT INTO schedules (day, start_time, end_time, subject, class_id, room, teacher_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            day,
            start_time,
            end_time,
            subject,
            class_id,
            room || null,
            teacher_id,
          ],
        );

        results.success.push({
          day,
          start_time,
          end_time,
          subject,
          class_id,
          room: room || null,
          teacher_id,
        });
        results.successCount++;
      } catch (error: any) {
        results.failed.push({
          row: i + 1,
          data: schedule,
          error: error.message || "Gagal mengimport data",
        });
        results.failedCount++;
      }
    }

    await connection.commit();

    res.json({
      ...results,
      message: `Berhasil import ${results.successCount} dari ${results.total} jadwal`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error importing schedules:", error);
    res.status(500).json({
      message: "Gagal mengimport data jadwal",
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    connection.release();
  }
};
