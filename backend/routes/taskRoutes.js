import express from "express";
import { body } from "express-validator";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getTasks) // scoped per-role inside the controller
  .post(
    authorize("admin", "manager"),
    [
      body("title").trim().notEmpty().withMessage("Task title is required"),
      body("project").isMongoId().withMessage("A valid project id is required"),
      body("status").optional().isIn(["todo", "in-progress", "review", "done"]),
      body("priority").optional().isIn(["low", "medium", "high", "urgent"]),
    ],
    validate,
    createTask
  );

router
  .route("/:id")
  .get(getTaskById)
  .put(
    [body("status").optional().isIn(["todo", "in-progress", "review", "done"])],
    validate,
    updateTask // fine-grained role checks (employee vs manager/admin) happen inside
  )
  .delete(authorize("admin", "manager"), deleteTask);

export default router;
