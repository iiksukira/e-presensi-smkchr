/** @format */

import { Router } from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { getPublicSettings } from "../controllers/settingsController.js";

const router = Router();

router.get("/", verifyToken, getPublicSettings);

export default router;
