import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

/**
 * protect: verifies the JWT sent in the Authorization header
 * and attaches the authenticated user to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id name email role isActive avatarColor");

    if (!user) {
      res.status(401);
      throw new Error("Not authorized, user no longer exists");
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error("Your account has been deactivated. Contact an admin.");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, token failed or expired");
  }
});

/**
 * authorize: restricts a route to a specific set of roles.
 * Usage: authorize("admin", "manager")
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Access denied. This action requires one of these roles: ${allowedRoles.join(", ")}`
      );
    }
    next();
  };
};
