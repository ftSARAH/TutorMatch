import { Router } from "express";
import Joi from "joi";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Request from "../models/Request.js";
import Session from "../models/Session.js";
import Payment from "../models/Payment.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Apply auth middleware to all student routes
router.use(authenticateToken);

// Student dashboard stats
router.get("/stats", async (req, res, next) => {
  try {
    const studentId = req.user._id;
    
    const totalRequests = await Request.countDocuments({ student: studentId });
    const pendingRequests = await Request.countDocuments({ 
      student: studentId, 
      status: "pending" 
    });
    const acceptedRequests = await Request.countDocuments({ 
      student: studentId, 
      status: "accepted" 
    });
    
    const totalEnrollments = await Enrollment.countDocuments({ student: studentId });
    const activeEnrollments = await Enrollment.countDocuments({ 
      student: studentId, 
      status: { $in: ["trial", "active"] } 
    });
    
    const upcomingSessions = await Session.countDocuments({ 
      student: studentId, 
      status: "scheduled",
      startTime: { $gt: new Date() }
    });
    
    const totalSpent = await Payment.aggregate([
      { $match: { student: studentId, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalRequests,
        pendingRequests,
        acceptedRequests,
        totalEnrollments,
        activeEnrollments,
        upcomingSessions,
        totalSpent: totalSpent[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all available courses (published only)
router.get("/courses", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const subject = req.query.subject || "";
    const gradeLevel = req.query.gradeLevel || "";
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Infinity;

    // Build query
    let query = { 
      status: "published",
      "enrollment.maxStudents": { $gt: 0 } // Only courses with available slots
    };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "content.overview": { $regex: search, $options: "i" } }
      ];
    }
    
    if (subject) {
      query.subject = subject;
    }
    
    if (gradeLevel) {
      query.gradeLevel = gradeLevel;
    }
    
    query["pricing.pricePerSession"] = { 
      $gte: minPrice, 
      $lte: maxPrice === Infinity ? 999999 : maxPrice 
    };

    const courses = await Course.find(query)
      .populate('teacher', 'name email bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate enrollment statistics
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await Enrollment.countDocuments({
          course: course._id,
          status: { $in: ["trial", "active"] }
        });
        
        const isRequested = await Request.exists({
          student: req.user._id,
          course: course._id,
          status: { $ne: "rejected" }
        });
        
        const isEnrolled = await Enrollment.exists({
          student: req.user._id,
          course: course._id,
          status: { $in: ["trial", "active"] }
        });

        return {
          ...course.toObject(),
          enrollmentCount,
          isRequested: !!isRequested,
          isEnrolled: !!isEnrolled,
          availableSlots: course.enrollment.maxStudents - enrollmentCount
        };
      })
    );

    const total = await Course.countDocuments(query);

    // Get filter options
    const subjects = await Course.distinct('subject', { status: "published" });
    const gradeLevels = await Course.distinct('gradeLevel', { status: "published" });
    const prices = await Course.aggregate([
      { $match: { status: "published" } },
      { $group: { 
        _id: null, 
        min: { $min: "$pricing.pricePerSession" }, 
        max: { $max: "$pricing.pricePerSession" } 
      }}
    ]);

    res.json({
      success: true,
      courses: coursesWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        subjects,
        gradeLevels,
        priceRange: prices[0] || { min: 0, max: 0 }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single course details
router.get("/courses/:id", async (req, res, next) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.id, 
      status: "published" 
    }).populate('teacher', 'name email bio subjects gradeLevels');

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Check if student has already requested/enrolled
    const existingRequest = await Request.findOne({
      student: req.user._id,
      course: req.params.id
    });

    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.id,
      status: { $in: ["trial", "active"] }
    });

    const enrollmentCount = await Enrollment.countDocuments({
      course: req.params.id,
      status: { $in: ["trial", "active"] }
    });

    res.json({
      success: true,
      course: {
        ...course.toObject(),
        enrollmentCount,
        availableSlots: course.enrollment.maxStudents - enrollmentCount,
        hasRequested: !!existingRequest,
        hasEnrolled: !!existingEnrollment,
        requestStatus: existingRequest?.status || null
      }
    });
  } catch (error) {
    next(error);
  }
});

// Request course enrollment
router.post("/courses/:id/request", async (req, res, next) => {
  try {
    const { message } = req.body;
    
    // Check if course exists and is published
    const course = await Course.findOne({ 
      _id: req.params.id, 
      status: "published" 
    }).populate('teacher', 'name email');

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Check if already requested or enrolled
    const existingRequest = await Request.findOne({
      student: req.user._id,
      course: req.params.id,
      status: { $ne: "rejected" }
    });

    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.id,
      status: { $in: ["trial", "active"] }
    });

    if (existingEnrollment) {
      return res.status(400).json({ 
        success: false, 
        message: "You are already enrolled in this course" 
      });
    }

    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: "You have already sent a request for this course" 
      });
    }

    // Create request
    const request = await Request.create({
      student: req.user._id,
      teacher: course.teacher._id,
      course: req.params.id,
      message: message || `I would like to enroll in ${course.title}`,
      status: "pending"
    });

    const populatedRequest = await Request.findById(request._id)
      .populate('student', 'name email')
      .populate('course', 'title subject');

    res.status(201).json({ success: true, request: populatedRequest });
  } catch (error) {
    next(error);
  }
});

// Get student's requests
router.get("/requests", async (req, res, next) => {
  try {
    const requests = await Request.find({ student: req.user._id })
      .populate('teacher', 'name email')
      .populate('course', 'title subject pricePerSession')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
});

// Get student's enrollments
router.get("/enrollments", async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate('teacher', 'name email')
      .populate('course', 'title subject pricing schedule')
      .sort({ createdAt: -1 });

    res.json({ success: true, enrollments });
  } catch (error) {
    next(error);
  }
});

// Get upcoming sessions for student
router.get("/sessions/upcoming", async (req, res, next) => {
  try {
    const upcomingSessions = await Session.find({
      student: req.user._id,
      status: "scheduled",
      startTime: { $gt: new Date() }
    })
    .populate('teacher', 'name email')
    .populate('course', 'title schedule')
    .sort({ startTime: 1 })
    .limit(20);

    res.json({ success: true, sessions: upcomingSessions });
  } catch (error) {
    next(error);
  }
});

// Create payment for course
router.post("/courses/:id/payment", async (req, res, next) => {
  try {
    const { amount, paymentMethod, sessionCount } = req.body;
    
    // Find enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.id,
      status: { $in: ["trial", "active"] }
    }).populate('course', 'title pricing');

    if (!enrollment) {
      return res.status(404).json({ 
        success: false, 
        message: "Enrollment not found" 
      });
    }

    // Calculate expected amount
    const expectedAmount = enrollment.course.pricing.pricePerSession * sessionCount;
    
    if (amount !== expectedAmount) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment amount doesn't match expected amount" 
      });
    }

    // Create payment
    const payment = await Payment.create({
      student: req.user._id,
      teacher: enrollment.teacher,
      session: null, // Will be updated when payment is processed
      amount: amount,
      currency: "USD",
      status: "pending",
      paymentMethod: paymentMethod || "online"
    });

    // Update enrollment payment
    await Enrollment.findByIdAndUpdate(enrollment._id, {
      $inc: { 
        "payment.paidAmount": amount,
        "payment.sessionsCompleted": sessionCount 
      },
      $push: {
        "payment.paymentHistory": {
          amount: amount,
          sessionCount: sessionCount,
          status: "paid"
        }
      }
    });

    res.status(201).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
});

// Cancel enrollment
router.put("/enrollments/:id/cancel", async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      { 
        _id: req.params.id, 
        student: req.user._id 
      },
      { status: "cancelled" },
      { new: true }
    ).populate('course', 'title');

    if (!enrollment) {
      return res.status(404).json({ 
        success: false, 
        message: "Enrollment not found" 
      });
    }

    // Cancel related sessions
    await Session.updateMany(
      { 
        student: req.user._id,
        course: enrollment.course._id,
        status: "scheduled"
      },
      { status: "cancelled" }
    );

    res.json({ 
      success: true, 
      message: `Enrollment for ${enrollment.course.title} has been cancelled`,
      enrollment 
    });
  } catch (error) {
    next(error);
  }
});

// Get student's payments and payment history
router.get("/payments", async (req, res, next) => {
  try {
    const studentId = req.user._id;
    
    // Get payment history
    const paymentHistory = await Payment.find({ student: studentId })
      .populate('course', 'title')
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });

    // Get pending payments (enrollments that need payment)
    const enrollments = await Enrollment.find({ 
      student: studentId,
      status: { $in: ['trial'] }
    })
      .populate('course', 'title pricing')
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });

    // Filter enrollments that need payment
    const pendingPayments = enrollments.filter(enrollment => {
      const now = new Date();
      const trialEndsAt = new Date(enrollment.trialEndsAt);
      const isTrialEnded = trialEndsAt <= now;
      
      // Check if needs payment
      return isTrialEnded || enrollment.status === 'pending_payment';
    });

    res.json({
      success: true,
      pendingPayments,
      history: paymentHistory
    });
  } catch (error) {
    next(error);
  }
});

export default router;

