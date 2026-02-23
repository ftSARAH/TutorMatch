import { Router } from "express";
import Joi from "joi";
import Contact from "../models/Contact.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = Router();

const contactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(20).allow(""),
  message: Joi.string().min(10).max(1000).required(),
});

// Public route to submit contact form
router.post("/", async (req, res, next) => {
  try {
    const data = await contactSchema.validateAsync(req.body, { 
      abortEarly: false, 
      stripUnknown: true 
    });

    const contact = await Contact.create({
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      message: data.message,
      status: "new"
    });

    res.status(201).json({ 
      success: true, 
      message: "Message sent successfully. We'll get back to you soon!",
      contactId: contact._id
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

// Admin routes - require authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Get all contact submissions with pagination
router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || "";
    const search = req.query.search || "";

    // Build query
    let query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } }
      ];
    }

    const contacts = await Contact.find(query)
      .populate('repliedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments(query);

    // Get status counts
    const statusCounts = await Contact.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {};
    statusCounts.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      statusStats
    });
  } catch (error) {
    next(error);
  }
});

// Get single contact submission
router.get("/:id", async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('repliedBy', 'name email');
    
    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: "Contact submission not found" 
      });
    }

    res.json({ success: true, contact });
  } catch (error) {
    next(error);
  }
});

// Update contact status and add admin notes
const updateContactSchema = Joi.object({
  status: Joi.string().valid("new", "read", "replied", "closed"),
  adminNotes: Joi.string().max(500).allow(""),
});

router.put("/:id", async (req, res, next) => {
  try {
    const data = await updateContactSchema.validateAsync(req.body, { 
      abortEarly: false, 
      stripUnknown: true 
    });

    const updateData = { ...data };
    
    // If status is being changed to "replied", set repliedAt and repliedBy
    if (data.status === "replied") {
      updateData.repliedAt = new Date();
      updateData.repliedBy = req.user._id;
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('repliedBy', 'name email');

    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: "Contact submission not found" 
      });
    }

    res.json({ success: true, contact });
  } catch (err) {
    if (err.isJoi) err.status = 400;
    next(err);
  }
});

// Delete contact submission
router.delete("/:id", async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: "Contact submission not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Contact submission deleted successfully" 
    });
  } catch (error) {
    next(error);
  }
});

// Get contact statistics for admin dashboard
router.get("/stats/summary", async (req, res, next) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const newContacts = await Contact.countDocuments({ status: "new" });
    const readContacts = await Contact.countDocuments({ status: "read" });
    const repliedContacts = await Contact.countDocuments({ status: "replied" });
    const closedContacts = await Contact.countDocuments({ status: "closed" });

    // Get contacts from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentContacts = await Contact.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get contacts from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyContacts = await Contact.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        total: totalContacts,
        new: newContacts,
        read: readContacts,
        replied: repliedContacts,
        closed: closedContacts,
        recent: recentContacts,
        weekly: weeklyContacts
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

