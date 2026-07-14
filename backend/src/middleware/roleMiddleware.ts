/** @format */

import type { Request, Response, NextFunction } from "express";
import { normalizeUserRole } from "../utils/roleUtils.js";

interface AuthRequest extends Request {
  user?: string | { id: number; role: string };
}

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || typeof req.user === "string") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied. Admin role required." });
  }

  next();
};

export const requireTeacher = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || typeof req.user === "string") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "guru") {
    return res
      .status(403)
      .json({ message: "Access denied. Teacher role required." });
  }

  next();
};

export const requireStudent = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || typeof req.user === "string") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "siswa") {
    return res
      .status(403)
      .json({ message: "Access denied. Student role required." });
  }

  next();
};

export const requireParent = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || typeof req.user === "string") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (normalizeUserRole(req.user.role) !== "orangtua") {
    return res
      .status(403)
      .json({ message: "Access denied. Parent role required." });
  }

  next();
};
