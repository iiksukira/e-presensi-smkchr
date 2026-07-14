/** @format */

import { Router } from "express";
import {
  getDashboardStats,
  getStudentAnnouncements,
  submitStudentAttendance,
  getStudentAttendanceHistory,
  getStudentFaceStatus,
  registerStudentFace,
  getStudentSchedule,
  getStudentProfile,
  cancelPermit,
  createPermit,
  getMyPermits,
  getStudentPermitDetail,
} from "../controllers/StudentController.js";
import { getAttendanceStatus } from "../controllers/attendanceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/dashboard", verifyToken, getDashboardStats);
router.get("/profile", verifyToken, getStudentProfile);
router.get("/announcements", verifyToken, getStudentAnnouncements);
router.post("/attendance", verifyToken, submitStudentAttendance);
router.get("/attendance-history", verifyToken, getStudentAttendanceHistory);
router.get("/attendance-status", verifyToken, getAttendanceStatus);
router.get("/face-status", verifyToken, getStudentFaceStatus);
router.post("/register-face", verifyToken, registerStudentFace);
router.get("/schedule", verifyToken, getStudentSchedule);
router.get("/permits", verifyToken, getMyPermits);
router.get("/permits/:id", verifyToken, getStudentPermitDetail);
router.post("/permits", verifyToken, createPermit);
router.delete("/permits/:id", verifyToken, cancelPermit);
export default router;
