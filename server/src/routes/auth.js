import { Router } from "express";
import Joi from "joi";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid("student", "teacher").required(),
  password: Joi.string().min(6).required(),
  subjects: Joi.array().items(Joi.string()).default([]),
  gradeLevels: Joi.array().items(Joi.string()).default([]),
  bio: Joi.string().allow(""),
});

router.post("/login", async (req, res, next) => {
  try {
    const data = await loginSchema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });

    const user = await User.findOne({ email: data.email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isValidPassword = await user.verifyPassword(data.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subjects: user.subjects,
        gradeLevels: user.gradeLevels,
        bio: user.bio
      }
    });
  } catch (err) {
    if (err.isJoi) err.status = 400;
    next(err);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const data = await registerSchema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: "Email already exists" 
      });
    }

    // Hash password and create user
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

    // Return user data without password hash
    const userResponse = await User.findById(user._id).select('-passwordHash');
    
    res.status(201).json({ 
      success: true, 
      message: "User registered successfully",
      user: userResponse 
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

export default router;

