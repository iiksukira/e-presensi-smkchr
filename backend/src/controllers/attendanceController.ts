/** @format */

import type { Request, Response } from "express";
import db from "../config/database.js";
import {
  getSystemSettings,
  determineAttendanceStatus,
} from "../utils/systemSettings.js";
import { SCHOOL_LOCATION, getDistanceInMeters } from "../utils/geolocation.js";

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

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

export const registerFace = async (req: AuthRequest, res: Response) => {
  const { face_data } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: "User tidak terautentikasi" });
  }

  const userId = req.user.id;
  const role = req.user.role;

  try {
    let tableName = role === "siswa" ? "students" : "teachers";

    await db.execute(
      `UPDATE ${tableName} SET face_data = ? WHERE user_id = ?`,
      [face_data, userId],
    );

    res.json({ message: "Data wajah berhasil disimpan" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menyimpan data wajah" });
  }
};

export const checkIn = async (req: AuthRequest, res: Response) => {
  const { descriptor, location_lat, location_lng } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: "User tidak terautentikasi" });
  }

  const userId = req.user.id;
  const role = req.user.role;

  if (typeof location_lat !== "number" || typeof location_lng !== "number") {
    return res
      .status(400)
      .json({ message: "Lokasi absensi belum tersedia atau tidak valid." });
  }

  try {
    const settings = await getSystemSettings();

    const distanceMeters = getDistanceInMeters(
      location_lat,
      location_lng,
      SCHOOL_LOCATION.lat,
      SCHOOL_LOCATION.lng,
    );

    if (distanceMeters > settings.toleranceMeters) {
      return res.status(400).json({
        message: `Lokasi terlalu jauh dari area absensi (${Math.round(
          distanceMeters,
        )} m). Batas toleransi ${settings.toleranceMeters} m.`,
      });
    }

    const tableName = role === "siswa" ? "students" : "teachers";
    const [rows]: any = await db.execute(
      `SELECT face_data FROM ${tableName} WHERE user_id = ?`,
      [userId],
    );

    if (!rows[0] || !rows[0].face_data) {
      return res.status(404).json({ message: "Wajah belum didaftarkan!" });
    }

    const savedDescriptor = JSON.parse(rows[0].face_data);

    const today = getAttendanceDate();
    const now = getAttendanceTime();

    const attendanceStatus = determineAttendanceStatus(now, settings);

    const [existing]: any = await db.execute(
      "SELECT id FROM attendance WHERE user_id = ? AND date = ?",
      [userId, today],
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: "Anda sudah melakukan absensi hari ini." });
    }

    await db.execute(
      `INSERT INTO attendance (user_id, date, time_in, status, location_lat, location_lng) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, today, now, attendanceStatus, location_lat, location_lng],
    );

    return res.json({
      message: "Absensi Berhasil!",
      time_in: now,
      status: attendanceStatus,
    });
  } catch (error) {
    return res.status(500).json({ message: "Gagal mencatat absensi" });
  }
};

export const getTodayAttendance = async (req: Request, res: Response) => {
  try {
    const today = getAttendanceDate();
    const [rows]: any = await db.execute(
      `SELECT a.id, a.user_id, a.time_in, a.status,
              u.full_name, u.role
       FROM attendance a
       INNER JOIN users u ON a.user_id = u.id
       WHERE DATE(CONVERT_TZ(a.date, '+00:00', '+07:00')) = ?
       ORDER BY a.time_in DESC`,
      [today],
    );

    const formattedRows = rows.map((row: any) => ({
      ...row,
      time_in: formatAttendanceTime(row.time_in),
    }));

    res.json(formattedRows);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data presensi hari ini" });
  }
};

export const getAttendanceHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User tidak terautentikasi" });
    }

    const userId = req.user.id;
    const { date, startDate, endDate, month } = req.query;

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
      attendanceByDate.set(normalizeAttendanceDate(row.date), row);
    });

    const formattedRows = [] as any[];
    let currentDate = new Date(start);
    const lastDate = new Date(end);

    while (currentDate <= lastDate) {
      const formattedDate = currentDate.toISOString().slice(0, 10);
      const row = attendanceByDate.get(formattedDate);

      if (row) {
        formattedRows.push({
          id: row.id,
          date: normalizeAttendanceDate(row.date),
          time_in: formatAttendanceTime(row.time_in),
          time_out: formatAttendanceTime(row.time_out),
          status: row.status,
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
    res.status(500).json({ message: "Gagal mengambil data riwayat absensi" });
  }
};

export const getAttendanceStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User tidak terautentikasi" });
    }

    const userId = req.user.id;
    const { date } = req.query;

    const targetDate = date ? String(date) : getAttendanceDate();

    const [rows]: any = await db.execute(
      `SELECT id, time_in, time_out FROM attendance 
       WHERE user_id = ? AND DATE(CONVERT_TZ(date, '+00:00', '+07:00')) = ?
       LIMIT 1`,
      [userId, targetDate],
    );

    const checkedIn = rows.length > 0 && !!rows[0].time_in;
    const checkedOut = rows.length > 0 && !!rows[0].time_out;

    const checkInTime =
      rows.length > 0 ? formatAttendanceTime(rows[0].time_in) : null;
    const checkOutTime =
      rows.length > 0 ? formatAttendanceTime(rows[0].time_out) : null;

    res.json({
      checkedIn,
      checkedOut,
      checkInTime,
      checkOutTime,
      date: targetDate,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil status absensi" });
  }
};

export const submitStudentAttendance = async (
  req: AuthRequest,
  res: Response,
) => {
  const { faceDescriptor, lat, lng, type } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: "User tidak terautentikasi" });
  }

  const userId = req.user.id;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({
      message: "Lokasi absensi belum tersedia atau tidak valid.",
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
        message: `Lokasi terlalu jauh dari area absensi (${Math.round(
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

    if (!rows[0] || !rows[0].face_data) {
      return res.status(400).json({
        message: "Wajah belum didaftarkan! Silakan daftar terlebih dahulu.",
      });
    }

    const savedDescriptor = JSON.parse(rows[0].face_data);
    const distance = computeDistance(faceDescriptor, savedDescriptor);

    if (distance > 0.45) {
      return res.status(401).json({
        message: "Wajah tidak cocok. Silakan coba lagi.",
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const timeNow = new Date().toTimeString().slice(0, 8);

    const [existing]: any = await db.execute(
      "SELECT id, time_in, time_out FROM attendance WHERE user_id = ? AND date = ?",
      [userId, today],
    );

    if (type === "in") {
      if (existing.length > 0 && existing[0].time_in) {
        return res.status(400).json({
          message: "Anda sudah melakukan absen masuk hari ini.",
        });
      }

      const attendanceStatus = determineAttendanceStatus(timeNow, settings);

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
        message: "Absen Masuk Berhasil!",
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
          message: "Anda sudah melakukan absen pulang hari ini.",
        });
      }

      if (existing.length > 0) {
        await db.execute(
          `UPDATE attendance SET time_out = ? WHERE user_id = ? AND date = ?`,
          [timeNow, userId, today],
        );

        return res.json({
          message: "Absen Pulang Berhasil!",
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
        const attendanceStatus = determineAttendanceStatus(timeNow, settings);

        await db.execute(
          `INSERT INTO attendance (user_id, date, time_out, status, location_lat, location_lng) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, today, timeNow, attendanceStatus, lat, lng],
        );

        return res.json({
          message: "Absen Pulang Berhasil!",
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

    return res.status(400).json({ message: "Tipe absensi tidak valid" });
  } catch (error) {
    return res.status(500).json({ message: "Gagal memproses absensi" });
  }
};

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
