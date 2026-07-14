/** @format */

import { Router } from "express";
import {
  checkIn,
  getTodayAttendance,
  getAttendanceHistory,
  getAttendanceStatus,
} from "../controllers/attendanceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register-face", verifyToken, checkIn);
router.post("/check-in", verifyToken, checkIn);
router.get("/today", verifyToken, getTodayAttendance);
router.get("/history", verifyToken, getAttendanceHistory);
router.get("/attendance-status", verifyToken, getAttendanceStatus);

export default router;
