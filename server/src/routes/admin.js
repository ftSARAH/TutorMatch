import { Router } from "express";
import Joi from "joi";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Session from "../models/Session.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import Notification from "../models/Notification.js";

const router = Router();

// Apply auth middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

const createUserSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid("student", "teacher", "admin").required(),
  password: Joi.string().min(6).required(),
  subjects: Joi.array().items(Joi.string()).default([]),
  gradeLevels: Joi.array().items(Joi.string()).default([]),
  bio: Joi.string().allow(""),
});

// Get dashboard statistics
router.get("/stats", async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ role: "student" });
    const teachers = await User.countDocuments({ role: "teacher" });
    const admins = await User.countDocuments({ role: "admin" });
    
    // Course statistics
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ status: "published" });
    const draftCourses = await Course.countDocuments({ status: "draft" });
    const archivedCourses = await Course.countDocuments({ status: "archived" });
    
    // Enrollment statistics
    const totalEnrollments = await Enrollment.countDocuments();
    const activeEnrollments = await Enrollment.countDocuments({ 
      status: { $in: ["trial", "active"] } 
    });
    
    // Session statistics
    const totalSessions = await Session.countDocuments();
    const upcomingSessions = await Session.countDocuments({ 
      status: "scheduled",
      scheduledAt: { $gt: new Date() }
    });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students,
          teachers,
          admins,
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          draft: draftCourses,
          archived: archivedCourses,
        },
        enrollments: {
          total: totalEnrollments,
          active: activeEnrollments,
        },
        sessions: {
          total: totalSessions,
          upcoming: upcomingSessions,
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all users with pagination
router.get("/users", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const role = req.query.role || "";

    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create new user
router.post("/users", async (req, res, next) => {
  try {
    const data = await createUserSchema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });

    const existing = await User.findOne({ email: data.email });
    if (existing) return res.status(409).json({ success: false, message: "Email already exists" });

    const passwordHash = await User.hashPassword(data.password);
    const user = await User.create({
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash,
      subjects: data.subjects,
      gradeLevels: data.gradeLevels,
      bio: data.bio,
    });

    const userResponse = await User.findById(user._id).select('-passwordHash');
    res.status(201).json({ success: true, user: userResponse });
  } catch (err) {
    if (err.isJoi) err.status = 400;
    next(err);
  }
});

// Get single user
router.get("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// Update user
const updateUserSchema = Joi.object({
  name: Joi.string().min(2),
  email: Joi.string().email(),
  role: Joi.string().valid("student", "teacher", "admin"),
  subjects: Joi.array().items(Joi.string()),
  gradeLevels: Joi.array().items(Joi.string()),
  bio: Joi.string().allow(""),
});

router.put("/users/:id", async (req, res, next) => {
  try {
    const data = await updateUserSchema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });

    // Check if email is being changed and if it already exists
    if (data.email) {
      const existing = await User.findOne({ email: data.email, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(409).json({ success: false, message: "Email already exists" });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    if (err.isJoi) err.status = 400;
    next(err);
  }
});

// Delete user
router.delete("/users/:id", async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Get all courses with teacher and enrollment details
router.get("/courses", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const subject = req.query.subject || "";

    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } }
      ];
    }
    if (status) {
      query.status = status;
    }
    if (subject) {
      query.subject = subject;
    }

    const courses = await Course.find(query)
      .populate('teacher', 'name email bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get enrollment details for each course
    const coursesWithEnrollments = await Promise.all(
      courses.map(async (course) => {
        const enrollments = await Enrollment.find({ course: course._id })
          .populate('student', 'name email')
          .sort({ enrolledAt: -1 });

        const activeEnrollments = enrollments.filter(e => 
          e.status === 'trial' || e.status === 'active'
        );
        
        const completedEnrollments = enrollments.filter(e => 
          e.status === 'completed' || e.status === 'cancelled'
        );

        // Get session statistics
        const totalSessions = await Session.countDocuments({ course: course._id });
        const upcomingSessions = await Session.countDocuments({ 
          course: course._id,
          status: 'scheduled',
          scheduledAt: { $gt: new Date() }
        });

        return {
          ...course.toObject(),
          enrolledStudents: enrollments,
          activeEnrollments: activeEnrollments.length,
          completedEnrollments: completedEnrollments.length,
          sessionStats: {
            total: totalSessions,
            upcoming: upcomingSessions
          }
        };
      })
    );

    const total = await Course.countDocuments(query);

    // Get filter options
    const subjects = await Course.distinct('subject');
    const statuses = ['draft', 'published', 'archived'];

    res.json({
      success: true,
      courses: coursesWithEnrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        subjects,
        statuses
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single course with complete details
router.get("/courses/:id", async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email bio subjects gradeLevels');

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Get all enrollments with student details
    const enrollments = await Enrollment.find({ course: req.params.id })
      .populate('student', 'name email')
      .sort({ enrolledAt: -1 });

    // Get session details
    const sessions = await Session.find({ course: req.params.id })
      .populate('student', 'name email')
      .sort({ scheduledAt: -1 });

    // Calculate statistics
    const activeEnrollments = enrollments.filter(e => 
      e.status === 'trial' || e.status === 'active'
    );
    const completedEnrollments = enrollments.filter(e => 
      e.status === 'completed' || e.status === 'cancelled'
    );

    const upcomingSessions = sessions.filter(s => 
      s.status === 'scheduled' && new Date(s.scheduledAt) > new Date()
    );
    const completedSessions = sessions.filter(s => 
      s.status === 'completed'
    );

    res.json({
      success: true,
      course: {
        ...course.toObject(),
        enrollments: enrollments,
        sessions: sessions,
        statistics: {
          activeEnrollments: activeEnrollments.length,
          completedEnrollments: completedEnrollments.length,
          upcomingSessions: upcomingSessions.length,
          completedSessions: completedSessions.length,
          totalSessions: sessions.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;