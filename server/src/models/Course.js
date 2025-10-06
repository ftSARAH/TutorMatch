import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    gradeLevel: { type: String, required: true },
    description: { type: String, required: true },
    content: {
      overview: String,
      objectives: [String],
      curriculum: [String],
      materials: [String]
    },
    pricing: {
      pricePerSession: { type: Number, required: true },
      totalSessions: { type: Number, default: 1 },
      freeTrialDays: { type: Number, default: 3 },
      discountPercentage: { type: Number, default: 0 },
      hasTrial: { type: Boolean, default: true },
      upfrontPayment: { type: Boolean, default: false },
      currency: { type: String, default: 'USD' }
    },
    schedule: {
      availability: [{ day: String, start: String, end: String }],
      duration: { type: Number, default: 60 }, // minutes
      timezone: { type: String, default: "UTC" }
    },
    enrollment: {
      maxStudents: { type: Number, default: 10 },
      currentStudents: { type: Number, default: 0 },
      enrolledStudents: [{ 
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        enrolledAt: { type: Date, default: Date.now },
        trialEndsAt: Date,
        status: { type: String, enum: ["trial", "active", "completed", "cancelled"], default: "trial" }
      }]
    },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Course", CourseSchema);