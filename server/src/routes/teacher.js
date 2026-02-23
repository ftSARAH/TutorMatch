import { Router } from "express";
import Joi from "joi";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Request from "../models/Request.js";
import Session from "../models/Session.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Apply auth middleware to all teacher routes
router.use(authenticateToken);

// Teacher dashboard stats
router.get("/stats", async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    
    const totalCourses = await Course.countDocuments({ teacher: teacherId });
    const publishedCourses = await Course.countDocuments({ teacher: teacherId, status: "published" });
    const totalEnrollments = await Enrollment.countDocuments({ teacher: teacherId });
    const activeStudents = await Enrollment.countDocuments({ 
      teacher: teacherId, 
      status: { $in: ["trial", "active"] } 
    });
    const pendingRequests = await Request.countDocuments({ 
      teacher: teacherId, 
      status: "pending" 
    });

    // Calculate earnings
    const enrollments = await Enrollment.find({ teacher: teacherId, status: "active" });
    const totalEarnings = enrollments.reduce((sum, enrollment) => {
      return sum + (enrollment.payment.paidAmount || 0);
    }, 0);

    res.json({
      success: true,
      stats: {
        totalCourses,
        publishedCourses,
        totalEnrollments,
        activeStudents,
        pendingRequests,
        totalEarnings
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get teacher's courses
router.get("/courses", async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || "";

    let query = { teacher: teacherId };
    if (status) {
      query.status = status;
    }

    const courses = await Course.find(query)
      .populate('enrollment.enrolledStudents.student', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      courses,
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

// Create new course
const createCourseSchema = Joi.object({
  title: Joi.string().min(3).required(),
  subject: Joi.string().required(),
  gradeLevel: Joi.string().required(),
  description: Joi.string().min(10).required(),
  content: Joi.object({
    overview: Joi.string().allow('').default(''),
    objectives: Joi.array().items(Joi.string()).default([]),
    curriculum: Joi.array().items(Joi.string()).default([]),
    materials: Joi.array().items(Joi.string()).default([])
  }).default({
    overview: '',
    objectives: [],
    curriculum: [],
    materials: []
  }),
  pricing: Joi.object({
    pricePerSession: Joi.number().min(0).required(),
    totalSessions: Joi.number().min(1).default(1),
    freeTrialDays: Joi.number().min(0).default(3),
    discountPercentage: Joi.number().min(0).max(100).default(0)
  }),
  schedule: Joi.object({
    availability: Joi.array().items(Joi.object({
      day: Joi.string().required(),
      start: Joi.string().required(),
      end: Joi.string().required()
    })),
    duration: Joi.number().min(30).default(60),
    timezone: Joi.string().default("UTC")
  }),
  enrollment: Joi.object({
    maxStudents: Joi.number().min(1).default(10)
  }),
  status: Joi.string().valid("draft", "published").default("draft")
});

router.post("/courses", async (req, res, next) => {
  try {
    const data = await createCourseSchema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });
    
    const course = await Course.create({
      ...data,
      teacher: req.user._id
    });

    const populatedCourse = await Course.findById(course._id)
      .populate('teacher', 'name email');

    res.status(201).json({ success: true, course: populatedCourse });
  } catch (err) {
    if (err.isJoi) err.status = 400;
    next(err);
  }
});

// Get single course
router.get("/courses/:id", async (req, res, next) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    }).populate('enrollment.enrolledStudents.student', 'name email');

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.json({ success: true, course });
  } catch (error) {
    next(error);
  }
});

// Update course
const updateCourseSchema = Joi.object({
  title: Joi.string().min(3),
  subject: Joi.string(),
  gradeLevel: Joi.string(),
  description: Joi.string().min(10),
  content: Joi.object({
    overview: Joi.string().allow(''),
    objectives: Joi.array().items(Joi.string()),
    curriculum: Joi.array().items(Joi.string()),
    materials: Joi.array().items(Joi.string())
  }),
  pricing: Joi.object({
    pricePerSession: Joi.number().min(0),
    totalSessions: Joi.number().min(1),
    freeTrialDays: Joi.number().min(0),
    discountPercentage: Joi.number().min(0).max(100)
  }),
  schedule: Joi.object({
    availability: Joi.array().items(Joi.object({
      day: Joi.string().required(),
      start: Joi.string().required(),
      end: Joi.string().required()
    })),
    duration: Joi.number().min(30),
    timezone: Joi.string()
  }),
  enrollment: Joi.object({
    maxStudents: Joi.number().min(1)
  }),
  status: Joi.string().valid("draft", "published", "archived")
});

router.put("/courses/:id", async (req, res, next) => {
  try {
    const data = await updateCourseSchema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });
    
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      data,
      { new: true, runValidators: true }
    ).populate('enrollment.enrolledStudents.student', 'name email');

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.json({ success: true, course });
  } catch (err) {
    if (err.isJoi) err.status = 400;
    next(err);
  }
});

// Delete course
router.delete("/courses/:id", async (req, res, next) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      teacher: req.user._id 
    });

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Check if course has active enrollments
    const activeEnrollments = await Enrollment.countDocuments({ 
      course: req.params.id, 
      status: { $in: ["trial", "active"] } 
    });

    // Cancel all enrollments for this course
    await Enrollment.updateMany(
      { course: req.params.id },
      { status: "cancelled" }
    );

    // Delete the course
    await Course.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true, 
      message: `Course deleted successfully. ${activeEnrollments} enrollments were cancelled.` 
    });
  } catch (error) {
    next(error);
  }
});

// Get student requests
router.get("/requests", async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const status = req.query.status || "";

    let query = { teacher: teacherId };
    if (status) {
      query.status = status;
    }

    const requests = await Request.find(query)
      .populate('student', 'name email')
      .populate('course', 'title subject')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
});

// Handle student request (accept/reject)
router.put("/requests/:id", async (req, res, next) => {
  try {
    const { status, responseMessage } = req.body;
    
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const request = await Request.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      { status, responseMessage },
      { new: true }
    ).populate('student', 'name email').populate('course', 'title');

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // If accepted, create enrollment
    if (status === "accepted") {
      const course = await Course.findById(request.course._id);
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + course.pricing.freeTrialDays);

      await Enrollment.create({
        student: request.student._id,
        course: request.course._id,
        teacher: req.user._id,
        trialEndsAt,
        status: "trial",
        payment: {
          totalAmount: course.pricing.pricePerSession * course.pricing.totalSessions,
          sessionsCompleted: 0
        }
      });

      // Update course enrollment
      await Course.findByIdAndUpdate(request.course._id, {
        $inc: { "enrollment.currentStudents": 1 },
        $push: {
          "enrollment.enrolledStudents": {
            student: request.student._id,
            trialEndsAt,
            status: "trial"
          }
        }
      });
    }

    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
});

// Get course enrollments
router.get("/courses/:id/enrollments", async (req, res, next) => {
  try {
    const courseId = req.params.id;
    
    // Verify course belongs to teacher
    const course = await Course.findOne({ _id: courseId, teacher: req.user._id });
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'name email')
      .sort({ enrolledAt: -1 });

    res.json({ success: true, enrollments });
  } catch (error) {
    next(error);
  }
});

// Session Management for Teachers

// Create new session
const createSessionSchema = Joi.object({
  student: Joi.string().required(),
  course: Joi.string().required(),
  scheduledAt: Joi.date().required(),
  duration: Joi.number().min(30).max(180).default(60),
  description: Joi.string().allow(''),
  meeting: Joi.object({
    platform: Joi.string().valid("zoom", "google_meet", "microsoft_teams", "other").required(),
    meetingId: Joi.string().allow(''),
    meetingPassword: Joi.string().allow(''),
    meetingUrl: Joi.string().uri().allow(''),
    meetingNumber: Joi.string().allow('')
  }).required(),
  materials: Joi.array().items(Joi.string()).default([]),
  notes: Joi.string().allow(''),
  homework: Joi.string().allow('')
});

router.post("/courses/:courseId/sessions", async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // Verify course belongs to teacher
    const course = await Course.findOne({ _id: courseId, teacher: req.user._id });
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const data = await createSessionSchema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });
    
    // Verify student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      student: data.student,
      course: courseId,
      status: { $in: ["trial", "active"] }
    });
    
    if (!enrollment) {
      return res.status(400).json({ 
        success: false, 
        message: "Student is not enrolled in this course" 
      });
    }

    // Create session
    const session = await Session.create({
      ...data,
      teacher: req.user._id
    });

    const populatedSession = await Session.findById(session._id)
      .populate('student', 'name email')
      .populate('course', 'title subject');

    res.status(201).json({ success: true, session: populatedSession });
  } catch (err) {
    if (err.isJoi) err.status = 400;
    next(err);
  }
});

// Get sessions for a course
router.get("/courses/:courseId/sessions", async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // Verify course belongs to teacher
    const course = await Course.findOne({ _id: courseId, teacher: req.user._id });
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const sessions = await Session.find({ course: courseId })
      .populate('student', 'name email')
      .sort({ scheduledAt: 1 });

    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
});

// Get all sessions for teacher
router.get("/sessions", async (req, res, next) => {
  try {
    const status = req.query.status || "";
    const upcoming = req.query.upcoming === "true";
    
    let query = { teacher: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (upcoming) {
      query.scheduledAt = { $gt: new Date() };
      query.status = "scheduled";
    }

    const sessions = await Session.find(query)
      .populate('student', 'name email')
      .populate('course', 'title subject')
      .sort({ scheduledAt: 1 });

    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
});

// Update session
const updateSessionSchema = Joi.object({
  scheduledAt: Joi.date(),
  duration: Joi.number().min(30).max(180),
  description: Joi.string().allow(''),
  status: Joi.string().valid("scheduled", "started", "completed", "cancelled" ),
  meeting: Joi.object({
    platform: Joi.string().valid("zoom", "google_meet", "microsoft_teams", "other"),
    meetingId: Joi.string().allow(''),
    meetingPassword: Joi.string().allow(''),
    meetingUrl: Joi.string().uri().allow(''),
    meetingNumber: Joi.string().allow('')
  }),
  materials: Joi.array().items(Joi.string()),
  notes: Joi.string().allow(''),
  homework: Joi.string().allow('')
});

router.put("/sessions/:sessionId", async (req, res, next) => {
  try {
    const data = await updateSessionSchema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });
    
    const session = await Session.findOneAndUpdate(
      { _id: req.params.sessionId, teacher: req.user._id },
      data,
      { new: true, runValidators: true }
    ).populate('student', 'name email').populate('course', 'title subject');

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    res.json({ success: true, session });
  } catch (err) {
    if (err.isJoi) err.status = 400;
    next(err);
  }
});

// Delete session
router.delete("/sessions/:sessionId", async (req, res, next) => {
  try {
    const session = await Session.findOneAndDelete({ 
      _id: req.params.sessionId, 
      teacher: req.user._id,
      status: "scheduled" // Only allow deletion of scheduled sessions
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found or cannot be deleted" });
    }

    res.json({ success: true, message: "Session deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Get teacher's payments and earnings
router.get("/payments", async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    
    // Get all payments made to this teacher
    const payments = await Payment.find({ teacher: teacherId })
      .populate('student', 'name email')
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    // Calculate earnings statistics
    const totalEarnings = await Payment.aggregate([
      { $match: { teacher: teacherId, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const pendingPayments = await Payment.countDocuments({ 
      teacher: teacherId, 
      status: "pending" 
    });

    const completedPayments = await Payment.countDocuments({ 
      teacher: teacherId, 
      status: "completed" 
    });

    // This month earnings
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthEarnings = await Payment.aggregate([
      { 
        $match: { 
          teacher: teacherId, 
          status: "completed",
          createdAt: { $gte: thisMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Last month earnings
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);
    
    const lastMonthEnd = new Date();
    lastMonthEnd.setDate(1);
    lastMonthEnd.setHours(0, 0, 0, 0);
    
    const lastMonthEarnings = await Payment.aggregate([
      { 
        $match: { 
          teacher: teacherId, 
          status: "completed",
          createdAt: { $gte: lastMonth, $lt: lastMonthEnd }
        } 
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.json({
      success: true,
      payments,
      earnings: {
        totalEarnings: totalEarnings[0]?.total || 0,
        pendingPayments,
        completedPayments,
        thisMonth: thisMonthEarnings[0]?.total || 0,
        lastMonth: lastMonthEarnings[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
