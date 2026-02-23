import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    service: "TutorMatch API",
    time: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

export default router;