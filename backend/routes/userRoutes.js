import express from "express";
import { body } from "express-validator";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAssignableUsers,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { ROLES } from "../models/User.js";

const router = express.Router();
const CREATABLE_ROLES = ["employee", "manager"];

router.use(protect); // every route below requires authentication

router.get("/list/assignable", authorize("admin", "manager"), getAssignableUsers);

router
  .route("/")
  .get(authorize("admin"), getUsers)
  .post(
    authorize("admin"),
    [
      body("name").trim().notEmpty().withMessage("Name is required"),
      body("email").isEmail().withMessage("A valid email is required"),
      body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
      body("role").isIn(CREATABLE_ROLES).withMessage("Admin can only create employee or manager accounts"),
    ],
    validate,
    createUser
  );

router
  .route("/:id")
  .get(authorize("admin"), getUserById)
  .put(
    authorize("admin"),
    [
      body("role").optional().isIn(ROLES).withMessage("Invalid role"),
      body("isActive").optional().isBoolean(),
    ],
    validate,
    updateUser
  )
  .delete(authorize("admin"), deleteUser);

export default router;
