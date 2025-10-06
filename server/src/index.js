import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectToDatabase } from "./lib/mongo.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import healthRouter from "./routes/health.js";
import adminRouter from "./routes/admin.js";
import authRouter from "./routes/auth.js";
import teacherRouter from "./routes/teacher.js";
import studentRouter from "./routes/student.js";
import contactRouter from "./routes/contact.js";
import chatRouter from "./routes/chat.js";
import paymentRouter from "./routes/payment.js";
import notificationsRouter from "./routes/notifications.js";
import reviewsRouter from "./routes/reviews.js";

dotenv.config();

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Routes
app.use("/api/health", healthRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/student", studentRouter);
app.use("/api/contact", contactRouter);
app.use("/api/chat", chatRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/reviews", reviewsRouter);

// 404 and Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`TutorMatch API listening on port ${PORT}`);
  });
}

startServer();

export default app;