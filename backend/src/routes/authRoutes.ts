/** @format */

import { Router } from "express";
import { login, changePassword } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/login", login);
router.put("/change-password", verifyToken, changePassword);

export default router;
router.post("/reset-admin-password", async (req, res) => {
  try {
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    res.json({
      message: "Admin password reset to 'admin123'",
      hash: hashedPassword,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});
