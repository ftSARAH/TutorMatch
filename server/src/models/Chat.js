import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    participants: [{
      user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
      },
      role: { 
        type: String, 
        enum: ["student", "teacher", "admin"], 
        required: true 
      }
    }],
    lastMessage: {
      content: String,
      sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      },
      timestamp: { 
        type: Date, 
        default: Date.now 
      }
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    // For group chats or specific purposes
    chatType: { 
      type: String, 
      enum: ["direct", "support", "course"], 
      default: "direct" 
    },
    // Optional: Link to course if it's a course-related chat
    course: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Course" 
    }
  },
  { timestamps: true }
);

// Index for better query performance
ChatSchema.index({ participants: 1 });
ChatSchema.index({ "lastMessage.timestamp": -1 });
ChatSchema.index({ chatType: 1 });

export default mongoose.model("Chat", ChatSchema);

