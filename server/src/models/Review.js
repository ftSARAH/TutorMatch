import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

// One review per student per teacher per course (course optional -> null treated as one bucket)
ReviewSchema.index({ student: 1, teacher: 1, course: 1 }, { unique: true });

export default mongoose.model("Review", ReviewSchema);


