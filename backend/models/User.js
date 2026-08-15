import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Roles supported by the system.
 * admin    -> full access: manage users, all projects, all tasks
 * manager  -> create/manage projects, assign tasks to employees
 * employee -> view assigned projects, update status of own tasks
 */
export const ROLES = ["admin", "manager", "employee"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never return password by default
    },
    role: {
      type: String,
      enum: ROLES,
      default: "employee",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatarColor: {
      // used by the UI to render a consistent colored initials avatar
      type: String,
      default: "#6366F1",
    },
  },
  { timestamps: true }
);

// Hash password before saving, only if it was modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

// Instance method to compare plaintext password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Strip sensitive fields when converting to JSON
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

export default User;
