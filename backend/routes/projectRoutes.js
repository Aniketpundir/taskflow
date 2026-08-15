import express from "express";
import { body } from "express-validator";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getProjects) // visibility is scoped per-role inside the controller
  .post(
    authorize("admin", "manager"),
    [
      body("name").trim().notEmpty().withMessage("Project name is required"),
      body("status")
        .optional()
        .isIn(["planning", "active", "on-hold", "completed"]),
      body("managerId").optional({ nullable: true }).isMongoId().withMessage("Invalid manager"),
      body("employeeIds").optional().isArray().withMessage("Employees must be a list"),
      body("employeeIds.*").optional().isMongoId().withMessage("Invalid employee"),
    ],
    validate,
    createProject
  );

router
  .route("/:id")
  .get(getProjectById)
  .put(
    authorize("admin", "manager"),
    [
      body("status")
        .optional()
        .isIn(["planning", "active", "on-hold", "completed"]),
      body("managerId").optional({ nullable: true }).isMongoId().withMessage("Invalid manager"),
      body("employeeIds").optional().isArray().withMessage("Employees must be a list"),
      body("employeeIds.*").optional().isMongoId().withMessage("Invalid employee"),
    ],
    validate,
    updateProject
  )
  .delete(authorize("admin", "manager"), deleteProject);

export default router;
