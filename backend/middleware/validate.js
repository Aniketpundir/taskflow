import { validationResult } from "express-validator";

/**
 * Runs after express-validator's chain of checks (e.g. body("email").isEmail())
 * and returns a clean 400 response if any validation failed.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

export default validate;
