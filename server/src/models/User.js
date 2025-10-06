import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ["admin", "student", "teacher"], required: true },
    passwordHash: { type: String, required: true },
    subjects: [{ type: String }],
    gradeLevels: [{ type: String }],
    bio: { type: String },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.methods.verifyPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.statics.hashPassword = async function (password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export default mongoose.model("User", UserSchema);