/** @format */

import { promises as fs } from "fs";
import path from "path";

export interface SystemSettings {
  attendanceStartTime: string;
  attendanceEndTime: string;
  toleranceMeters: number;
  enableNotifications: boolean;
  autoLogoutTime: number;
  attendanceLocationLat: number;
  attendanceLocationLng: number;
  toleranceMinutes?: number;
  notification_sound_duration?: number;
}

const settingsPath = path.resolve(process.cwd(), "system-settings.json");

const defaultSettings: SystemSettings = {
  attendanceStartTime: "07:00",
  attendanceEndTime: "14:00",
  toleranceMeters: 10,
  enableNotifications: false,
  autoLogoutTime: 60,
  attendanceLocationLat: -6.2744207,
  attendanceLocationLng: 107.6503034,
  toleranceMinutes: 0,
  notification_sound_duration: 30,
};

const readSettingsFile = async (): Promise<SystemSettings> => {
  try {
    const json = await fs.readFile(settingsPath, "utf-8");
    const parsed = JSON.parse(json);
    return {
      ...defaultSettings,
      ...parsed,
    };
  } catch (error) {
    return defaultSettings;
  }
};

export const getSystemSettings = async (): Promise<SystemSettings> => {
  return await readSettingsFile();
};

export const saveSystemSettings = async (
  settings: Partial<SystemSettings>,
): Promise<SystemSettings> => {
  const currentSettings = await getSystemSettings();
  const nextSettings: SystemSettings = {
    ...currentSettings,
    ...settings,
  };
  await fs.writeFile(
    settingsPath,
    JSON.stringify(nextSettings, null, 2),
    "utf-8",
  );
  return nextSettings;
};

export const determineAttendanceStatus = (
  timeInString: string,
  settings: SystemSettings,
): string => {
  try {
    const timeParts = timeInString.split(":").map(Number);
    if (timeParts.length !== 3 || timeParts.some(isNaN)) {
      throw new Error("Invalid time format");
    }
    const [hoursIn, minutesIn, secondsIn] = timeParts as [
      number,
      number,
      number,
    ];
    const timeInMinutes = hoursIn * 60 + minutesIn;

    let startTimeMinutes = 0;
    let endTimeMinutes = 0;

    const parseTimeString = (timeStr: string): number => {
      if (timeStr.includes("T")) {
        const date = new Date(timeStr);
        return date.getHours() * 60 + date.getMinutes();
      } else {
        const parts = timeStr.split(":").map(Number);
        if (parts.length !== 2 || parts.some(isNaN)) {
          throw new Error("Invalid time format");
        }
        const [hours, minutes] = parts as [number, number];
        return hours * 60 + minutes;
      }
    };

    startTimeMinutes = parseTimeString(settings.attendanceStartTime);
    endTimeMinutes = parseTimeString(settings.attendanceEndTime);

    const toleranceMinutes = settings.toleranceMinutes || 0;
    const startTimeWithTolerance = startTimeMinutes + toleranceMinutes;

    let adjustedTimeInMinutes = timeInMinutes;
    let adjustedStartTimeWithTolerance = startTimeWithTolerance;

    if (startTimeWithTolerance < startTimeMinutes) {
      adjustedStartTimeWithTolerance = startTimeWithTolerance;
    }

    if (endTimeMinutes < startTimeMinutes) {
      if (timeInMinutes < startTimeMinutes) {
        adjustedTimeInMinutes = timeInMinutes + 24 * 60;
        adjustedStartTimeWithTolerance = startTimeWithTolerance + 24 * 60;
      }
    }

    if (adjustedTimeInMinutes <= adjustedStartTimeWithTolerance) {
      return "Hadir";
    } else {
      return "Terlambat";
    }
  } catch (error) {
    console.error("Error in determineAttendanceStatus:", error);
    return "Hadir";
  }
};

export const getDetailedAttendanceStatus = (
  timeInString: string,
  settings: SystemSettings,
): {
  status: "hadir" | "terlambat";
  isEarly: boolean;
  isLate: boolean;
  minutesDifference: number;
  earlyMinutes: number;
  lateMinutes: number;
} => {
  try {
    const timeParts = timeInString.split(":").map(Number);
    const [hoursIn, minutesIn] = timeParts as [number, number];
    const timeInMinutes = hoursIn * 60 + minutesIn;

    const parseTimeString = (timeStr: string): number => {
      if (timeStr.includes("T")) {
        const date = new Date(timeStr);
        return date.getHours() * 60 + date.getMinutes();
      } else {
        const parts = timeStr.split(":").map(Number);
        if (parts.length < 2 || parts.some(isNaN)) {
          throw new Error("Invalid time format");
        }
        const [hours, minutes] = parts as [number, number];
        return hours * 60 + minutes;
      }
    };

    const startTimeMinutes = parseTimeString(settings.attendanceStartTime);
    const endTimeMinutes = parseTimeString(settings.attendanceEndTime);
    const toleranceMinutes = settings.toleranceMinutes || 0;
    const endTimeWithTolerance = endTimeMinutes + toleranceMinutes;

    let isEarly = false;
    let isLate = false;
    let earlyMinutes = 0;
    let lateMinutes = 0;

    if (timeInMinutes < startTimeMinutes) {
      isEarly = true;
      earlyMinutes = startTimeMinutes - timeInMinutes;
    } else if (timeInMinutes > endTimeWithTolerance) {
      isLate = true;
      lateMinutes = timeInMinutes - endTimeWithTolerance;
    }

    let status: "hadir" | "terlambat" = "hadir";
    if (timeInMinutes > endTimeWithTolerance) {
      status = "terlambat";
    }

    return {
      status,
      isEarly,
      isLate,
      minutesDifference: isEarly ? earlyMinutes : lateMinutes,
      earlyMinutes,
      lateMinutes,
    };
  } catch (error) {
    console.error("Error in getDetailedAttendanceStatus:", error);
    return {
      status: "hadir",
      isEarly: false,
      isLate: false,
      minutesDifference: 0,
      earlyMinutes: 0,
      lateMinutes: 0,
    };
  }
};
