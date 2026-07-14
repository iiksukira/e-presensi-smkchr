/** @format */

import type { Request, Response } from "express";
import {
  getSystemSettings as readSettings,
  saveSystemSettings as persistSettings,
} from "../utils/systemSettings.js";

export const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const settings = await readSettings();
    res.json({
      attendanceStartTime: settings.attendanceStartTime,
      attendanceEndTime: settings.attendanceEndTime,
      toleranceMeters: settings.toleranceMeters,
      enableNotifications: settings.enableNotifications,
      autoLogoutTime: settings.autoLogoutTime,
      attendanceLocationLat: settings.attendanceLocationLat,
      attendanceLocationLng: settings.attendanceLocationLng,
      notification_sound_duration: settings.notification_sound_duration || 30,
    });
  } catch (error) {
    console.error("Error getting public settings:", error);
    res.status(500).json({ message: "Gagal mengambil pengaturan sistem" });
  }
};

export const getSystemSettingsHandler = async (req: Request, res: Response) => {
  try {
    const settings = await readSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error getting system settings:", error);
    res.status(500).json({ message: "Gagal mengambil pengaturan sistem" });
  }
};

export const updateSystemSettingsHandler = async (req: Request, res: Response) => {
  try {
    const settings = await persistSettings(req.body);
    res.json(settings);
  } catch (error) {
    console.error("Error saving system settings:", error);
    res.status(500).json({ message: "Gagal menyimpan pengaturan sistem" });
  }
};
