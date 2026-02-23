import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      lowercase: true, 
      trim: true 
    },
    phone: { 
      type: String, 
      trim: true 
    },
    message: { 
      type: String, 
      required: true, 
      trim: true 
    },
    status: { 
      type: String, 
      enum: ["new", "read", "replied", "closed"], 
      default: "new" 
    },
    adminNotes: { 
      type: String, 
      trim: true 
    },
    repliedAt: { 
      type: Date 
    },
    repliedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }
  },
  { timestamps: true }
);

// Index for better query performance
ContactSchema.index({ status: 1, createdAt: -1 });
ContactSchema.index({ email: 1 });

export default mongoose.model("Contact", ContactSchema);

