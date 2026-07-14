/** @format */

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { normalizeUserRole } from "../utils/roleUtils.js";

interface AuthRequest extends Request {
  user?: string | jwt.JwtPayload;
}

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
      console.warn("⚠️ Token tidak tersedia pada request:", {
        path: req.path,
        authHeader: authHeader ? "present" : "missing",
      });
      return res.status(403).json({ message: "Token tidak tersedia" });
    }

    try {
      const secretKey = process.env.JWT_SECRET ?? "default_secret";

      const decoded = jwt.verify(token, secretKey) as any;
      decoded.role = normalizeUserRole(decoded.role);
      req.user = decoded;
      next();
    } catch (verifyError) {
      console.error("❌ Token verification failed:", {
        error: (verifyError as Error).message,
        name: (verifyError as Error).name,
        tokenLength: token.length,
      });
      return res.status(401).json({
        message: "Token tidak valid atau sudah expired",
        error: (verifyError as Error).message,
      });
    }
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res
      .status(500)
      .json({ message: "Server error saat verifikasi token" });
  }
};
