/** @format */

import { Router } from "express";
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  submitTeacherAttendance,
  getTeacherAttendanceStatus,
  getMyClasses,
  getStudentsByClass,
  manualAttendance,
  getDashboardStats,
  getTeacherProfile,
  registerTeacherFace,
  getTeacherFaceStatus,
  getTeachingSchedule,
  getMyPermits,
  getPermitDetail,
  createPermit,
  updatePermit,
  cancelPermit,
  rejectStudentPermit,
  approveStudentPermit,
  getStudentPermits,
  getStudentPermitDetail,
  bulkAttendance,
  exportAttendance,
  uploadScheduleAttachment,
  getScheduleAttachment,
  deleteScheduleAttachment,
} from "../controllers/teacherController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/dashboard-stats", verifyToken, getDashboardStats);
router.get("/profile", verifyToken, getTeacherProfile);
router.get("/my-classes", verifyToken, getMyClasses);
router.get("/students-by-class/:classId", verifyToken, getStudentsByClass);
router.get("/attendance-status", verifyToken, getTeacherAttendanceStatus);
router.post("/manual-attendance", verifyToken, manualAttendance);
router.post("/bulk-attendance", verifyToken, bulkAttendance);
router.get("/export-attendance/:classId", verifyToken, exportAttendance);
router.get("/announcements", verifyToken, getAnnouncements);
router.post("/announcement", verifyToken, createAnnouncement);
router.put("/announcement/:id", verifyToken, updateAnnouncement);
router.delete("/announcement/:id", verifyToken, deleteAnnouncement);
router.post("/attendance", verifyToken, submitTeacherAttendance);
router.get("/face-status", verifyToken, getTeacherFaceStatus);
router.post("/register-face", verifyToken, registerTeacherFace);
router.get("/schedule", verifyToken, getTeachingSchedule);
router.get("/permits", verifyToken, getMyPermits);
router.get("/permits/:id", verifyToken, getPermitDetail);
router.post("/permits", verifyToken, createPermit);
router.put("/permits/:id", verifyToken, updatePermit);
router.delete("/permits/:id", verifyToken, cancelPermit);
router.get("/student-permits", verifyToken, getStudentPermits);
router.get("/student-permits/:id", verifyToken, getStudentPermitDetail);
router.put("/student-permits/:id/approve", verifyToken, approveStudentPermit);
router.put("/student-permits/:id/reject", verifyToken, rejectStudentPermit);
router.post(
  "/schedule/:scheduleId/attachment",
  verifyToken,
  uploadScheduleAttachment,
);
router.get(
  "/schedule/:scheduleId/attachment",
  verifyToken,
  getScheduleAttachment,
);
router.delete(
  "/schedule/:scheduleId/attachment",
  verifyToken,
  deleteScheduleAttachment,
);
export default router;
