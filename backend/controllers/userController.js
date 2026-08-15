import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { ROLES } from "../models/User.js";

/**
 * @desc    Get all users (with optional search/filter/pagination)
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { search = "", role, page = 1, limit = 10 } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  if (role && ROLES.includes(role)) {
    query.role = role;
  }

  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit) || 10, 100);

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    users,
  });
});

/**
 * @desc    Get single user by id
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.status(200).json({ success: true, user });
});

/**
 * @desc    Admin creates a new user directly (can assign any role)
 * @route   POST /api/users
 * @access  Private/Admin
 */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({ name, email, password, role });
  res.status(201).json({ success: true, user });
});

/**
 * @desc    Update a user's details (name, role, active status)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { name, role, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Prevent an admin from locking themselves out by demoting/deactivating
  // their own account when they are the only admin in the system.
  if (
    req.user._id.equals(user._id) &&
    (role !== undefined && role !== "admin") 
  ) {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      res.status(400);
      throw new Error("Cannot change role: you are the only admin left");
    }
  }

  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();
  res.status(200).json({ success: true, user });
});

/**
 * @desc    Delete a user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (req.user._id.equals(user._id)) {
    res.status(400);
    throw new Error("You cannot delete your own account");
  }

  await user.deleteOne();
  res.status(200).json({ success: true, message: "User deleted successfully" });
});

/**
 * @desc    Get a lightweight list of active users for dropdowns
 *          (e.g. assigning tasks, adding project members)
 * @route   GET /api/users/list/assignable
 * @access  Private/Admin,Manager
 */
export const getAssignableUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true })
    .select("name email role avatarColor")
    .sort({ name: 1 })
    .lean();
  res.status(200).json({ success: true, users });
});
