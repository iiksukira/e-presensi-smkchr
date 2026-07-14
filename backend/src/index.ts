/** @format */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import authRoutes from "./routes/authRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";
import { verifyToken } from "./middleware/authMiddleware.js";
import { upload } from "./middleware/upload.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/parent", parentRoutes);

app.get("/api", (req, res) => {
  res.json("Welcome to API endpoints Server E-Absen SMKCHR");
});

app.get("/", (req, res) => {
  res.json("Welcome to Root Server E-Absen SMKCHR");
});

app.post(
  "/api/upload/permit",
  verifyToken,
  upload.single("file"),
  (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada file yang diupload",
        });
      }

      const fileUrl = `/uploads/permits/${req.file.filename}`;

      res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengupload file",
      });
    }
  },
);

const handleMultipleUpload = (req: any, res: any) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada file yang diupload",
      });
    }

    const fileUrls = req.files.map(
      (file: any) => `/uploads/permits/${file.filename}`,
    );

    res.json({
      success: true,
      urls: fileUrls,
      count: fileUrls.length,
    });
  } catch (error) {
    console.error("Error in multiple upload:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengupload file",
    });
  }
};

app.post(
  "/api/upload/permits",
  verifyToken,
  upload.array("files", 5),
  handleMultipleUpload,
);

app.post(
  "/api/upload/student-permits",
  verifyToken,
  upload.array("files", 5),
  handleMultipleUpload,
);

app.post(
  "/api/upload/teacher-permits",
  verifyToken,
  upload.array("files", 5),
  handleMultipleUpload,
);

const uploadsPath = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsPath));

app.listen(PORT, () => {
  console.log(`Server Absensi berjalan di port ${PORT}`);
});
