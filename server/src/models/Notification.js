import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Either recipient OR audienceRole must be present. We don't enforce both
    // at schema level to allow broadcasting via audienceRole only.
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    audienceRole: {
      type: String,
      enum: ["admin", "teacher", "student", "all"],
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "request_created",
        "request_accepted",
        "request_rejected",
        "contact_updated",
        "payment_status",
        "system",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Object, default: {} },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);



