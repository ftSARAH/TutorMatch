import mongoose from "mongoose";

const EnrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    enrolledAt: { type: Date, default: Date.now },
    trialEndsAt: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ["trial", "active", "completed", "cancelled", "expired"], 
      default: "trial" 
    },
    payment: {
      totalAmount: Number,
      paidAmount: { type: Number, default: 0 },
      sessionsCompleted: { type: Number, default: 0 },
      nextPaymentDue: Date,
      paymentHistory: [{
        amount: Number,
        paidAt: { type: Date, default: Date.now },
        sessionCount: Number,
        status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" }
      }]
    },
    sessions: [{
      scheduledAt: Date,
      status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
      notes: String,
      rating: Number,
      feedback: String
    }]
  },
  { timestamps: true }
);

export default mongoose.model("Enrollment", EnrollmentSchema);

