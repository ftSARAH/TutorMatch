import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 60 }, // in minutes
    status: { type: String, enum: ["scheduled", "started", "completed", "cancelled"], default: "scheduled" },
    confirmation: { student: { type: Boolean, default: false }, teacher: { type: Boolean, default: false } },
    meeting: {
      platform: { type: String, enum: ["zoom", "google_meet", "microsoft_teams", "other"], required: true },
      meetingId: String,
      meetingPassword: String,
      meetingUrl: String,
      meetingNumber: String
    },
    description: { type: String, default: "" },
    materials: [{ type: String }], // URLs or file paths for session materials
    notes: { type: String, default: "" }, // Teacher notes for the session
    homework: { type: String, default: "" }, // Homework or follow-up tasks
    attendance: {
      studentAttended: { type: Boolean, default: false },
      teacherAttended: { type: Boolean, default: false },
      durationAttended: { type: Number, default: 0 } // in minutes
    },
    feedback: {
      student: { rating: Number, comment: String },
      teacher: { rating: Number, comment: String }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Session", SessionSchema);