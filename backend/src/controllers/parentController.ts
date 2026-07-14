/** @format */

import type { Request, Response } from "express";
import db from "../config/database.js";
import * as studentController from "./StudentController.js";

interface ParentUserRequest extends Request {
  user?: {
    id: number;
    role?: string;
    [key: string]: any;
  };
}

const getLinkedStudent = async (parentUserId: number) => {
  const [rows]: any = await db.execute(
    `SELECT p.user_id AS parent_user_id,
            p.phone,
            p.student_id,
            s.id AS student_row_id,
            s.user_id AS student_user_id,
            s.class_id,
            s.nisn,
            u.full_name AS student_name,
            uc.full_name AS parent_name,
            uc.username AS parent_username,
            c.class_name
     FROM parents p
     LEFT JOIN students s ON p.student_id = s.id
     LEFT JOIN users u ON s.user_id = u.id
     LEFT JOIN users uc ON p.user_id = uc.id
     LEFT JOIN classes c ON s.class_id = c.id
     WHERE p.user_id = ?`,
    [parentUserId],
  );

  return rows[0] || null;
};

const attachChildUserId = async (req: ParentUserRequest) => {
  const parentUserId = req.user?.id;

  if (!parentUserId) {
    throw new Error("User tidak terautentikasi");
  }

  const linkedStudent = await getLinkedStudent(parentUserId);

  if (!linkedStudent?.student_user_id) {
    throw new Error("Data anak orang tua belum terhubung");
  }

  req.user = {
    ...(req.user || {}),
    id: linkedStudent.student_user_id,
    role: "siswa",
  };

  return linkedStudent;
};

export const getDashboardStats = async (req: ParentUserRequest, res: Response) => {
  try {
    const linkedStudent = await attachChildUserId(req);

    const childReq = req as ParentUserRequest;
    childReq.user = {
      ...(childReq.user || {}),
      id: linkedStudent.student_user_id,
      role: "siswa",
    };

    await studentController.getDashboardStats(childReq as any, res);
  } catch (error: any) {
    console.error("Error in parent getDashboardStats:", error);
    res.status(500).json({
      message: error?.message || "Gagal mengambil data dashboard orang tua",
    });
  }
};

export const getStudentAnnouncements = async (
  req: ParentUserRequest,
  res: Response,
) => {
  try {
    await attachChildUserId(req);
    await studentController.getStudentAnnouncements(req as any, res);
  } catch (error: any) {
    console.error("Error in parent getStudentAnnouncements:", error);
    res.status(500).json({
      message: error?.message || "Gagal mengambil pengumuman anak",
    });
  }
};

export const submitStudentAttendance = async (
  req: ParentUserRequest,
  res: Response,
) => {
  try {
    await attachChildUserId(req);
    await studentController.submitStudentAttendance(req as any, res);
  } catch (error: any) {
    console.error("Error in parent submitStudentAttendance:", error);
    res.status(500).json({
      message: error?.message || "Gagal memproses absensi anak",
    });
  }
};

export const getStudentAttendanceHistory = async (
  req: ParentUserRequest,
  res: Response,
) => {
  try {
    await attachChildUserId(req);
    await studentController.getStudentAttendanceHistory(req as any, res);
  } catch (error: any) {
    console.error("Error in parent getStudentAttendanceHistory:", error);
    res.status(500).json({
      message: error?.message || "Gagal mengambil riwayat absensi anak",
    });
  }
};

export const getStudentSchedule = async (req: ParentUserRequest, res: Response) => {
  try {
    await attachChildUserId(req);
    await studentController.getStudentSchedule(req as any, res);
  } catch (error: any) {
    console.error("Error in parent getStudentSchedule:", error);
    res.status(500).json({
      message: error?.message || "Gagal mengambil jadwal anak",
    });
  }
};

export const getStudentProfile = async (req: ParentUserRequest, res: Response) => {
  const parentUserId = req.user?.id;

  if (!parentUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const linkedStudent = await getLinkedStudent(parentUserId);

    if (!linkedStudent) {
      return res.status(404).json({ message: "Data orang tua tidak ditemukan" });
    }

    res.json({
      id: linkedStudent.parent_user_id,
      fullName: linkedStudent.parent_name || "Orang Tua",
      username: linkedStudent.parent_username || null,
      phone: linkedStudent.phone || null,
      child: {
        id: linkedStudent.student_row_id,
        userId: linkedStudent.student_user_id,
        fullName: linkedStudent.student_name || "Anak",
        nisn: linkedStudent.nisn || null,
        classId: linkedStudent.class_id || null,
        className: linkedStudent.class_name || "-",
      },
    });
  } catch (error) {
    console.error("Error in parent getStudentProfile:", error);
    res.status(500).json({ message: "Gagal mengambil profil orang tua" });
  }
};

export const getChildData = async (req: ParentUserRequest, res: Response) => {
  const parentUserId = req.user?.id;

  if (!parentUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const linkedStudent = await getLinkedStudent(parentUserId);

    if (!linkedStudent) {
      return res.status(404).json({ message: "Data anak tidak ditemukan" });
    }

    res.json({
      child: {
        id: linkedStudent.student_row_id,
        fullName: linkedStudent.student_name || "Anak",
        nisn: linkedStudent.nisn || null,
        classId: linkedStudent.class_id || null,
        className: linkedStudent.class_name || "-",
        status: "Aktif",
      },
      parent: {
        id: linkedStudent.parent_user_id,
        fullName: linkedStudent.parent_name || "Orang Tua",
        phone: linkedStudent.phone || null,
      },
    });
  } catch (error) {
    console.error("Error in parent getChildData:", error);
    res.status(500).json({ message: "Gagal mengambil data anak" });
  }
};

export const getMyPermits = async (req: ParentUserRequest, res: Response) => {
  try {
    await attachChildUserId(req);
    await studentController.getMyPermits(req as any, res);
  } catch (error: any) {
    console.error("Error in parent getMyPermits:", error);
    res.status(500).json({
      message: error?.message || "Gagal mengambil data izin anak",
    });
  }
};

export const createPermit = async (req: ParentUserRequest, res: Response) => {
  try {
    await attachChildUserId(req);
    await studentController.createPermit(req as any, res);
  } catch (error: any) {
    console.error("Error in parent createPermit:", error);
    res.status(500).json({
      message: error?.message || "Gagal membuat pengajuan izin anak",
    });
  }
};

export const cancelPermit = async (req: ParentUserRequest, res: Response) => {
  try {
    await attachChildUserId(req);
    await studentController.cancelPermit(req as any, res);
  } catch (error: any) {
    console.error("Error in parent cancelPermit:", error);
    res.status(500).json({
      message: error?.message || "Gagal membatalkan izin anak",
    });
  }
};

export const getStudentPermitDetail = async (
  req: ParentUserRequest,
  res: Response,
) => {
  try {
    await attachChildUserId(req);
    await studentController.getStudentPermitDetail(req as any, res);
  } catch (error: any) {
    console.error("Error in parent getStudentPermitDetail:", error);
    res.status(500).json({
      message: error?.message || "Gagal mengambil detail izin anak",
    });
  }
};
