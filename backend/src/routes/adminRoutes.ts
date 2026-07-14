/** @format */

import { Router } from "express";
import {
  getDashboardStats,
  getStudents,
  createStudent,
  updateStudent,
  deleteAllStudents,
  deleteStudent,
  deleteAllTeachers,
  getAllTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  getAllClasses,
  addClass,
  updateClass,
  deleteClass,
  getMajors,
  getAttendanceReport,
  getAllParents,
  addParent,
  updateParent,
  deleteParent,
  getBiometricStatus,
  resetFace,
  deleteFace,
  addFaceImageColumns,
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAttendanceTrends,
  getLatenessByMajor,
  rejectTeacherPermit,
  approveTeacherPermit,
  getTeacherPermits,
  getClassDetail,
  debugGetAllAnnouncements,
  importStudents,
  importTeachers,
  importSchedules,
} from "../controllers/adminController.js";
import {
  getSystemSettingsHandler,
  updateSystemSettingsHandler,
} from "../controllers/settingsController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

const router = Router();

router.get("/stats", verifyToken, requireAdmin, getDashboardStats);
router.get("/students", verifyToken, requireAdmin, getStudents);
router.post("/students", verifyToken, requireAdmin, createStudent);
router.put("/students/:id", verifyToken, requireAdmin, updateStudent);
router.delete("/students", verifyToken, requireAdmin, deleteAllStudents);
router.delete("/students/:id", verifyToken, requireAdmin, deleteStudent);
router.delete("/teachers", verifyToken, requireAdmin, deleteAllTeachers);
router.get("/teachers", verifyToken, requireAdmin, getAllTeachers);
router.post("/teachers", verifyToken, requireAdmin, addTeacher);
router.put("/teachers/:id", verifyToken, requireAdmin, updateTeacher);
router.delete("/teachers/:id", verifyToken, requireAdmin, deleteTeacher);
router.get("/classes", verifyToken, requireAdmin, getAllClasses);
router.post("/classes", verifyToken, requireAdmin, addClass);
router.put("/classes/:id", verifyToken, requireAdmin, updateClass);
router.delete("/classes/:id", verifyToken, requireAdmin, deleteClass);
router.get("/majors", verifyToken, requireAdmin, getMajors);
router.get("/reports", verifyToken, requireAdmin, getAttendanceReport);
router.get("/parents", verifyToken, requireAdmin, getAllParents);
router.post("/parents", verifyToken, requireAdmin, addParent);
router.put("/parents/:id", verifyToken, requireAdmin, updateParent);
router.delete("/parents/:id", verifyToken, requireAdmin, deleteParent);
router.get("/biometric-status", verifyToken, requireAdmin, getBiometricStatus);
router.post("/reset-face/:userId", verifyToken, resetFace);
router.post("/delete-face/:userId", verifyToken, deleteFace);
router.post("/add-face-image-columns", addFaceImageColumns);
router.get("/schedule", verifyToken, requireAdmin, getAllSchedules);
router.post("/schedule", verifyToken, requireAdmin, createSchedule);
router.put("/schedule/:id", verifyToken, requireAdmin, updateSchedule);
router.delete("/schedule/:id", verifyToken, requireAdmin, deleteSchedule);
router.get(
  "/attendance-trends",
  verifyToken,
  requireAdmin,
  getAttendanceTrends,
);
router.get("/lateness-by-major", verifyToken, requireAdmin, getLatenessByMajor);
router.get("/settings", verifyToken, requireAdmin, getSystemSettingsHandler);
router.put("/settings", verifyToken, requireAdmin, updateSystemSettingsHandler);
router.get("/teacher-permits", verifyToken, requireAdmin, getTeacherPermits);
router.put(
  "/teacher-permits/:id/approve",
  verifyToken,
  requireAdmin,
  approveTeacherPermit,
);
router.put(
  "/teacher-permits/:id/reject",
  verifyToken,
  requireAdmin,
  rejectTeacherPermit,
);

router.get("/classes/:id", verifyToken, requireAdmin, getClassDetail);

router.get(
  "/debug/announcements",
  verifyToken,
  requireAdmin,
  debugGetAllAnnouncements,
);
router.post("/students/import", verifyToken, requireAdmin, importStudents);
router.post("/teachers/import", verifyToken, requireAdmin, importTeachers);
router.post("/schedules/import", verifyToken, requireAdmin, importSchedules);

export default router;
