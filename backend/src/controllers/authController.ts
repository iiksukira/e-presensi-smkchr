/** @format */

import type { Request, Response } from "express";
import db from "../config/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { normalizeUserRole } from "../utils/roleUtils.js";

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.execute("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    const user = (rows as any)[0];

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password salah" });
    }

    const normalizedRole = normalizeUserRole(user.role);

    const token = jwt.sign(
      { id: user.id, role: normalizedRole },
      process.env.JWT_SECRET ?? "default_secret",
      { expiresIn: "1d" },
    );

    return res.json({
      message: "Login Berhasil",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        role: normalizedRole,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const userId = (req as any).user.id;

  try {
    const [rows] = await db.execute("SELECT password FROM users WHERE id = ?", [
      userId,
    ]);

    const user = (rows as any)[0];

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password lama salah" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashedNewPassword,
      userId,
    ]);

    return res.json({ message: "Password berhasil diubah" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};
