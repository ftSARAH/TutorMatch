import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    chat: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Chat", 
      required: true 
    },
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    content: { 
      type: String, 
      required: true, 
      trim: true 
    },
    messageType: { 
      type: String, 
      enum: ["text", "image", "file", "system"], 
      default: "text" 
    },
    // For file attachments
    attachments: [{
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      url: String
    }],
    // Message status
    isRead: { 
      type: Boolean, 
      default: false 
    },
    readBy: [{
      user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      },
      readAt: { 
        type: Date, 
        default: Date.now 
      }
    }],
    // For message editing/deletion
    isEdited: { 
      type: Boolean, 
      default: false 
    },
    editedAt: Date,
    isDeleted: { 
      type: Boolean, 
      default: false 
    },
    deletedAt: Date
  },
  { timestamps: true }
);

// Index for better query performance
MessageSchema.index({ chat: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ isRead: 1 });

export default mongoose.model("Message", MessageSchema);

