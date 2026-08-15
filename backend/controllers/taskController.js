import asyncHandler from "express-async-handler";
import Task from "../models/Task.js";
import Project from "../models/Project.js";

/**
 * Confirms the current user is allowed to view/act on the given project
 * (same visibility rule as projectController's scopeToUser, applied to one doc).
 */
const userCanAccessProject = (user, project) => {
  if (user.role === "admin") return true;
  if (user.role === "manager") {
    return (
      project.createdBy.equals(user._id) ||
      project.members.some((m) => m.equals(user._id))
    );
  }
  return project.members.some((m) => m.equals(user._id));
};

/**
 * @desc    Get tasks (scoped to project access; employees only see their own
 *          assigned tasks, admin/manager see all tasks within accessible projects)
 * @route   GET /api/tasks
 * @access  Private
 */
export const getTasks = asyncHandler(async (req, res) => {
  const { project, status, priority, search = "", page = 1, limit = 12 } = req.query;

  const query = {};

  if (project) {
    const proj = await Project.findById(project);
    if (!proj || !userCanAccessProject(req.user, proj)) {
      res.status(403);
      throw new Error("You don't have access to this project's tasks");
    }
    query.project = project;
  } else {
    // No specific project requested: scope by role across all projects
    if (req.user.role === "employee") {
      query.assignedTo = req.user._id;
    } else if (req.user.role === "manager") {
      const ownedProjects = await Project.find({
        $or: [{ createdBy: req.user._id }, { members: req.user._id }],
      }).select("_id");
      query.project = { $in: ownedProjects.map((p) => p._id) };
    }
    // admin: no extra scoping, sees everything
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (search) query.$text = { $search: search };

  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit) || 12, 100);

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate("project", "name status")
      .populate("assignedTo", "name email avatarColor")
      .populate("createdBy", "name email avatarColor")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Task.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: tasks.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    tasks,
  });
});

/**
 * @desc    Get single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
export const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate("project", "name status members createdBy")
    .populate("assignedTo", "name email avatarColor")
    .populate("createdBy", "name email avatarColor");

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  const canAccess =
    req.user.role === "admin" ||
    userCanAccessProject(req.user, task.project) ||
    task.assignedTo?._id?.equals(req.user._id);

  if (!canAccess) {
    res.status(403);
    throw new Error("You don't have access to this task");
  }

  res.status(200).json({ success: true, task });
});

/**
 * @desc    Create a task within a project
 * @route   POST /api/tasks
 * @access  Private/Admin,Manager
 */
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, project, assignedTo, status, priority, dueDate } = req.body;

  const proj = await Project.findById(project);
  if (!proj) {
    res.status(404);
    throw new Error("Project not found");
  }
  if (!userCanAccessProject(req.user, proj)) {
    res.status(403);
    throw new Error("You don't have access to this project");
  }

  const task = await Task.create({
    title,
    description,
    project,
    assignedTo: assignedTo || null,
    status,
    priority,
    dueDate,
    createdBy: req.user._id,
  });

  const populated = await task.populate([
    { path: "project", select: "name status" },
    { path: "assignedTo", select: "name email avatarColor" },
    { path: "createdBy", select: "name email avatarColor" },
  ]);

  res.status(201).json({ success: true, task: populated });
});

/**
 * @desc    Update a task. Employees may ONLY update the status of tasks
 *          assigned to them. Admin/Manager can update any field.
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate("project");
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  const isAssignee = task.assignedTo?.equals(req.user._id);

  if (req.user.role === "employee") {
    if (!isAssignee) {
      res.status(403);
      throw new Error("You can only update tasks assigned to you");
    }
    // Employees are restricted to changing status only
    if (req.body.status !== undefined) {
      task.status = req.body.status;
    }
  } else {
    // admin / manager
    if (req.user.role === "manager" && !userCanAccessProject(req.user, task.project)) {
      res.status(403);
      throw new Error("You don't have access to this task's project");
    }
    const { title, description, assignedTo, status, priority, dueDate } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
  }

  await task.save();

  const populated = await task.populate([
    { path: "project", select: "name status" },
    { path: "assignedTo", select: "name email avatarColor" },
    { path: "createdBy", select: "name email avatarColor" },
  ]);

  res.status(200).json({ success: true, task: populated });
});

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private/Admin,Manager
 */
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate("project");
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  if (req.user.role === "manager" && !userCanAccessProject(req.user, task.project)) {
    res.status(403);
    throw new Error("You don't have access to this task's project");
  }

  await task.deleteOne();
  res.status(200).json({ success: true, message: "Task deleted successfully" });
});
