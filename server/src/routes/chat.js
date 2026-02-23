import { Router } from "express";
import Joi from "joi";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";
import mongoose from "mongoose";

const router = Router();

// Apply authentication to all chat routes
router.use(authenticateToken);

const createChatSchema = Joi.object({
  participants: Joi.array().items(
    Joi.object({
      userId: Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      }).required(),
      role: Joi.string().valid("student", "teacher", "admin").required()
    })
  ).min(2).required(),
  chatType: Joi.string().valid("direct", "support", "course").default("direct"),
  course: Joi.string().custom((value, helpers) => {
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }).optional()
});

const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  messageType: Joi.string().valid("text", "image", "file", "system").default("text"),
  attachments: Joi.array().items(
    Joi.object({
      filename: Joi.string(),
      originalName: Joi.string(),
      mimeType: Joi.string(),
      size: Joi.number(),
      url: Joi.string()
    })
  ).default([])
});

// Get all conversations for the current user
router.get("/conversations", async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const conversations = await Chat.find({
      participants: { $elemMatch: { user: userId } },
      isActive: true
    })
    .populate('participants.user', 'name email role')
    .populate('lastMessage.sender', 'name')
    .sort({ 'lastMessage.timestamp': -1 });

    // Get unread message counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          chat: conversation._id,
          sender: { $ne: userId },
          readBy: { $not: { $elemMatch: { user: userId } } }
        });

        return {
          ...conversation.toObject(),
          unreadCount
        };
      })
    );

    res.json({
      success: true,
      conversations: conversationsWithUnread
    });
  } catch (error) {
    next(error);
  }
});

// Create a new chat/conversation
router.post("/conversations", async (req, res, next) => {
  try {
    console.log('Creating conversation with data:', req.body);
    console.log('Current user:', req.user);
    
    const data = await createChatSchema.validateAsync(req.body, { 
      abortEarly: false, 
      stripUnknown: true 
    });

    const userId = req.user._id;
    const userRole = req.user.role;

    console.log('User ID:', userId, 'User Role:', userRole);

    // Check if participants exist and are valid
    const participantIds = data.participants.map(p => p.userId);
    console.log('Participant IDs:', participantIds);
    
    const users = await User.find({ _id: { $in: participantIds } });
    console.log('Found users:', users.length, 'Expected:', participantIds.length);
    
    if (users.length !== participantIds.length) {
      console.log('Some participants not found');
      return res.status(400).json({
        success: false,
        message: "One or more participants not found"
      });
    }

    // Check if chat already exists between these participants
    const existingChat = await Chat.findOne({
      participants: {
        $all: data.participants.map(p => ({
          user: p.userId,
          role: p.role
        }))
      },
      isActive: true
    });

    if (existingChat) {
      console.log('Conversation already exists');
      return res.json({
        success: true,
        conversation: existingChat,
        message: "Conversation already exists"
      });
    }

    // Create new chat
    console.log('Creating new chat...');
    const chat = await Chat.create({
      participants: data.participants.map(p => ({
        user: p.userId,
        role: p.role
      })),
      chatType: data.chatType,
      course: data.course
    });

    console.log('Chat created successfully:', chat._id);

    const populatedChat = await Chat.findById(chat._id)
      .populate('participants.user', 'name email role');

    res.status(201).json({
      success: true,
      conversation: populatedChat
    });
  } catch (err) {
    console.error('Error creating conversation:', err);
    if (err.isJoi) {
      const errors = err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({ 
        success: false, 
        message: "Validation error",
        errors 
      });
    }
    next(err);
  }
});

// Get messages for a specific conversation
router.get("/conversations/:chatId/messages", async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if user is participant in this chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: { $elemMatch: { user: userId } },
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or access denied"
      });
    }

    const messages = await Message.find({
      chat: chatId,
      isDeleted: false
    })
    .populate('sender', 'name email role')
    .populate('readBy.user', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Mark messages as read for current user
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        readBy: { $not: { $elemMatch: { user: userId } } }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// Send a message
router.post("/conversations/:chatId/messages", async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    
    const data = await sendMessageSchema.validateAsync(req.body, { 
      abortEarly: false, 
      stripUnknown: true 
    });

    // Check if user is participant in this chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: { $elemMatch: { user: userId } },
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or access denied"
      });
    }

    // Create message
    const message = await Message.create({
      chat: chatId,
      sender: userId,
      content: data.content,
      messageType: data.messageType,
      attachments: data.attachments
    });

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        content: data.content,
        sender: userId,
        timestamp: new Date()
      }
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email role');

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (err) {
    if (err.isJoi) {
      const errors = err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({ 
        success: false, 
        message: "Validation error",
        errors 
      });
    }
    next(err);
  }
});

// Get available users to chat with (based on user role)
router.get("/users", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    let query = { _id: { $ne: userId } }; // Exclude current user
    
    // Role-based filtering
    if (userRole === 'student') {
      // Students can chat with teachers and admins
      query.role = { $in: ['teacher', 'admin'] };
    } else if (userRole === 'teacher') {
      // Teachers can chat with students and admins
      query.role = { $in: ['student', 'admin'] };
    } else if (userRole === 'admin') {
      // Admins can chat with everyone
      query.role = { $in: ['student', 'teacher'] };
    }

    const users = await User.find(query)
      .select('name email role subjects gradeLevels')
      .sort({ name: 1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
});

// Mark messages as read
router.put("/conversations/:chatId/read", async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Check if user is participant in this chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: { $elemMatch: { user: userId } },
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or access denied"
      });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        readBy: { $not: { $elemMatch: { user: userId } } }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({
      success: true,
      message: "Messages marked as read"
    });
  } catch (error) {
    next(error);
  }
});

// Delete a message (soft delete)
router.delete("/messages/:messageId", async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      sender: userId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found or access denied"
      });
    }

    await Message.findByIdAndUpdate(messageId, {
      isDeleted: true,
      deletedAt: new Date()
    });

    res.json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    next(error);
  }
});

// Get chat statistics for admin
router.get("/stats", async (req, res, next) => {
  try {
    const totalChats = await Chat.countDocuments({ isActive: true });
    const totalMessages = await Message.countDocuments({ isDeleted: false });
    const unreadMessages = await Message.countDocuments({
      readBy: { $size: 0 },
      isDeleted: false
    });

    // Messages by type
    const messagesByType = await Message.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$messageType", count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalChats,
        totalMessages,
        unreadMessages,
        messagesByType
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
