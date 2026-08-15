import jwt from "jsonwebtoken";

/**
 * Signs a JWT containing the user's id and role.
 * Role is embedded so the frontend can render UI immediately after login,
 * although the backend always re-validates the role from the DB per request.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export default generateToken;
