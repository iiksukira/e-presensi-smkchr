/** @format */

import { Router } from "express";
import {
  getDashboardStats,
  getStudentAnnouncements,
  submitStudentAttendance,
  getStudentAttendanceHistory,
  getStudentSchedule,
  cancelPermit,
  createPermit,
  getMyPermits,
  getStudentPermitDetail,
  getStudentProfile as getParentProfile,
  getChildData,
} from "../controllers/parentController.js";
import { getAttendanceStatus } from "../controllers/attendanceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireParent } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(verifyToken, requireParent);

router.get("/dashboard", getDashboardStats);
router.get("/profile", getParentProfile);
router.get("/child-data", getChildData);
router.get("/announcements", getStudentAnnouncements);
router.post("/attendance", submitStudentAttendance);
router.get("/attendance-history", getStudentAttendanceHistory);
router.get("/attendance-status", getAttendanceStatus);
router.get("/schedule", getStudentSchedule);
router.get("/permits", getMyPermits);
router.get("/permits/:id", getStudentPermitDetail);
router.post("/permits", createPermit);
router.delete("/permits/:id", cancelPermit);

export default router;
