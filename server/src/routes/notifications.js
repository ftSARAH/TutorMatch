import { Router } from "express";
import Notification from "../models/Notification.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.use(authenticateToken);

// List notifications for the current user (own + audienceRole broadcast)
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 10, unread } = req.query;
    const filter = {
      $or: [
        { recipient: req.user._id },
        { audienceRole: req.user.role },
        { audienceRole: "all" },
      ],
    };
    if (unread === "true") filter.isRead = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);

    res.json({
      success: true,
      notifications,
      pagination: { page: Number(page), pages: Math.ceil(total / limit), total },
    });
  } catch (err) {
    next(err);
  }
});

// Unread count
router.get("/unread-count", async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      $or: [
        { recipient: req.user._id },
        { audienceRole: req.user.role },
        { audienceRole: "all" },
      ],
      isRead: false,
    });
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
});

// Mark one as read
router.put("/:id/read", async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, notification: notif });
  } catch (err) {
    next(err);
  }
});

// Mark all as read
router.put("/read-all", async (req, res, next) => {
  try {
    const filter = {
      $or: [
        { recipient: req.user._id },
        { audienceRole: req.user.role },
        { audienceRole: "all" },
      ],
      isRead: false,
    };
    await Notification.updateMany(filter, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;



