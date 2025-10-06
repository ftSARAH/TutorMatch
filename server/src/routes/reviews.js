import { Router } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import Review from '../models/Review.js';
import User from '../models/User.js';

const router = Router();

const objectId = (value, helpers) => {
  if (value === null) return value; // allow null for course
  if (!mongoose.Types.ObjectId.isValid(value)) return helpers.error('any.invalid');
  return value;
};

const createSchema = Joi.object({
  teacherId: Joi.string().custom(objectId).required(),
  courseId: Joi.string().custom(objectId).allow(null).optional(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().allow('').max(2000).optional()
});

router.post('/', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can create reviews' });
    }

    const data = await createSchema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });

    // Ensure teacher exists and is a teacher
    const teacher = await User.findById(data.teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const review = await Review.findOneAndUpdate(
      { student: req.user._id, teacher: data.teacherId, course: data.courseId || null },
      { rating: data.rating, comment: data.comment || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, review });
  } catch (err) {
    if (err.isJoi) {
      const errors = err.details.map(d => ({ field: d.path.join('.'), message: d.message }));
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }
    next(err);
  }
});

// Public: list reviews for a teacher
router.get('/teacher/:teacherId', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const teacherId = req.params.teacherId;
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ success: false, message: 'Invalid teacher id' });
    }

    const reviews = await Review.find({ teacher: teacherId })
      .populate('student', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ teacher: teacherId });
    const agg = await Review.aggregate([
      { $match: { teacher: new mongoose.Types.ObjectId(teacherId) } },
      { $group: { _id: '$teacher', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    res.json({ success: true, reviews, pagination: { page: Number(page), pages: Math.ceil(total / limit), total }, summary: { average: agg[0]?.avgRating || 0, count: agg[0]?.count || 0 } });
  } catch (err) {
    next(err);
  }
});

// Admin: list all reviews
router.get('/admin/all', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const { page = 1, limit = 20, teacherId, studentId } = req.query;
    const filter = {};
    if (teacherId && mongoose.Types.ObjectId.isValid(teacherId)) filter.teacher = teacherId;
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) filter.student = studentId;

    const reviews = await Review.find(filter)
      .populate('student', 'name email')
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    res.json({ success: true, reviews, pagination: { page: Number(page), pages: Math.ceil(total / limit), total } });
  } catch (err) {
    next(err);
  }
});

export default router;


