import { Router } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Helper to normalize user id regardless of token shape
const getUserId = (req) => (req.user?._id?.toString?.() || req.user?.userId);

// Validation schemas
const createPaymentSchema = Joi.object({
  courseId: Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }).required(),
  paymentMethod: Joi.string().valid('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash').required(),
  amount: Joi.number().min(0).required(),
  notes: Joi.string().allow('').optional()
});

const updatePaymentSchema = Joi.object({
  paymentStatus: Joi.string().valid('pending', 'completed', 'failed', 'refunded', 'cancelled').optional(),
  refundAmount: Joi.number().min(0).optional(),
  refundReason: Joi.string().allow('').optional(),
  notes: Joi.string().allow('').optional()
});

// Student: Create payment for course
router.post('/create', authenticateToken, async (req, res, next) => {
  try {
    const data = await createPaymentSchema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });
    const studentId = getUserId(req);

    // Get course details
    const course = await Course.findById(data.courseId).populate('teacher', 'name email');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if student is enrolled
    const enrollment = course.enrollment.enrolledStudents.find(
      student => student.student.toString() === studentId
    );
    
    if (!enrollment) {
      return res.status(400).json({ success: false, message: 'You are not enrolled in this course' });
    }

    // Check if payment already exists for this course
    const existingPayment = await Payment.findOne({
      student: studentId,
      course: data.courseId,
      paymentStatus: { $in: ['pending', 'completed'] }
    });

    if (existingPayment) {
      return res.status(400).json({ success: false, message: 'Payment already exists for this course' });
    }

    // Create payment record
    const payment = await Payment.create({
      student: studentId,
      teacher: course.teacher._id,
      course: data.courseId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'pending',
      trialExpired: enrollment.status === 'trial' && new Date() > new Date(enrollment.trialEndsAt),
      notes: data.notes || ''
    });

    // Populate the payment with course and user details
    await payment.populate([
      { path: 'student', select: 'name email' },
      { path: 'teacher', select: 'name email' },
      { path: 'course', select: 'title subject gradeLevel pricing' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      payment
    });

  } catch (err) {
    if (err.isJoi) {
      const errors = err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }
    next(err);
  }
});

// Student: Get my payments
router.get('/my-payments', authenticateToken, async (req, res, next) => {
  try {
    const studentId = getUserId(req);
    const { page = 1, limit = 10, status } = req.query;

    const query = { student: studentId };
    if (status) {
      query.paymentStatus = status;
    }

    const payments = await Payment.find(query)
      .populate('teacher', 'name email')
      .populate('course', 'title subject gradeLevel pricing')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (err) {
    next(err);
  }
});

// Teacher: Get payments for my courses
router.get('/teacher-payments', authenticateToken, async (req, res, next) => {
  try {
    const teacherId = getUserId(req);
    const { page = 1, limit = 10, status, courseId } = req.query;

    const query = { teacher: teacherId };
    if (status) {
      query.paymentStatus = status;
    }
    if (courseId) {
      query.course = courseId;
    }

    const payments = await Payment.find(query)
      .populate('student', 'name email')
      .populate('course', 'title subject gradeLevel')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (err) {
    next(err);
  }
});

// Teacher: Update payment status
router.put('/:paymentId', authenticateToken, async (req, res, next) => {
  try {
    const data = await updatePaymentSchema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });
    const teacherId = getUserId(req);

    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Check if teacher owns this payment
    if (payment.teacher.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this payment' });
    }

    // Update payment
    const updateData = { ...data };
    if (data.refundAmount && data.refundAmount > 0) {
      updateData.refundDate = new Date();
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.paymentId,
      updateData,
      { new: true }
    ).populate([
      { path: 'student', select: 'name email' },
      { path: 'teacher', select: 'name email' },
      { path: 'course', select: 'title subject gradeLevel' }
    ]);

    res.json({
      success: true,
      message: 'Payment updated successfully',
      payment: updatedPayment
    });

  } catch (err) {
    if (err.isJoi) {
      const errors = err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }
    next(err);
  }
});

// Admin: Get all payments with analytics
router.get('/admin/all', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { page = 1, limit = 20, status, studentId, teacherId, courseId, startDate, endDate } = req.query;

    const query = {};
    if (status) query.paymentStatus = status;
    if (studentId) query.student = studentId;
    if (teacherId) query.teacher = teacherId;
    if (courseId) query.course = courseId;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('student', 'name email')
      .populate('teacher', 'name email')
      .populate('course', 'title subject gradeLevel')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (err) {
    next(err);
  }
});

// Admin: Get payment analytics
router.get('/admin/analytics', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.paymentDate = {};
      if (startDate) dateFilter.paymentDate.$gte = new Date(startDate);
      if (endDate) dateFilter.paymentDate.$lte = new Date(endDate);
    }

    // Total income
    const totalIncome = await Payment.aggregate([
      { $match: { paymentStatus: 'completed', ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Income by student
    const incomeByStudent = await Payment.aggregate([
      { $match: { paymentStatus: 'completed', ...dateFilter } },
      { $group: { _id: '$student', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      { $project: { student: { name: 1, email: 1 }, total: 1, count: 1 } },
      { $sort: { total: -1 } }
    ]);

    // Income by teacher
    const incomeByTeacher = await Payment.aggregate([
      { $match: { paymentStatus: 'completed', ...dateFilter } },
      { $group: { _id: '$teacher', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'teacher' } },
      { $unwind: '$teacher' },
      { $project: { teacher: { name: 1, email: 1 }, total: 1, count: 1 } },
      { $sort: { total: -1 } }
    ]);

    // Income by course
    const incomeByCourse = await Payment.aggregate([
      { $match: { paymentStatus: 'completed', ...dateFilter } },
      { $group: { _id: '$course', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: '$course' },
      { $project: { course: { title: 1, subject: 1, gradeLevel: 1 }, total: 1, count: 1 } },
      { $sort: { total: -1 } }
    ]);

    // Payment status summary
    const statusSummary = await Payment.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      analytics: {
        totalIncome: totalIncome[0]?.total || 0,
        incomeByStudent,
        incomeByTeacher,
        incomeByCourse,
        statusSummary
      }
    });

  } catch (err) {
    next(err);
  }
});

// Get courses that need payment (for students)
router.get('/courses-needing-payment', authenticateToken, async (req, res, next) => {
  try {
    const studentId = getUserId(req);

    // Find courses where student is enrolled and trial has expired or upfront payment required
    const courses = await Course.find({
      'enrollment.enrolledStudents': {
        $elemMatch: {
          student: studentId,
          $or: [
            { status: 'trial', trialEndsAt: { $lt: new Date() } },
            { status: 'active' }
          ]
        }
      }
    }).populate('teacher', 'name email');

    const coursesNeedingPayment = [];

    for (const course of courses) {
      const enrollment = course.enrollment.enrolledStudents.find(
        student => student.student.toString() === studentId
      );

      // Check if payment already exists
      const existingPayment = await Payment.findOne({
        student: studentId,
        course: course._id,
        paymentStatus: { $in: ['pending', 'completed'] }
      });

      if (!existingPayment) {
        const needsPayment = 
          (course.pricing.upfrontPayment && enrollment.status === 'trial') ||
          (enrollment.status === 'trial' && new Date() > new Date(enrollment.trialEndsAt));

        if (needsPayment) {
          coursesNeedingPayment.push({
            course: {
              _id: course._id,
              title: course.title,
              subject: course.subject,
              gradeLevel: course.gradeLevel,
              pricing: course.pricing
            },
            teacher: course.teacher,
            enrollment,
            trialExpired: new Date() > new Date(enrollment.trialEndsAt)
          });
        }
      }
    }

    res.json({
      success: true,
      coursesNeedingPayment
    });

  } catch (err) {
    next(err);
  }
});

export default router;
