import asyncHandler from "express-async-handler";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

/**
 * Builds a Mongo query that scopes projects to what the current user
 * is allowed to see:
 *  - admin: everything
 *  - manager: projects they created OR are a member of
 *  - employee: projects they are a member of only
 */
const scopeToUser = (user) => {
  if (user.role === "admin") return {};
  if (user.role === "manager") {
    return { $or: [{ createdBy: user._id }, { members: user._id }] };
  }
  return { members: user._id };
};

const uniqueIds = (ids = []) => [...new Set(ids.filter(Boolean).map((id) => id.toString()))];

const resolveProjectPeople = async ({ req, project, isCreate = false }) => {
  const { managerId, employeeIds, members } = req.body;
  const employeeSource = employeeIds !== undefined ? employeeIds : members;
  const selectedEmployeeIds = uniqueIds(employeeSource || project?.members || []);

  let ownerId = project?.createdBy || req.user._id;

  if (req.user.role === "admin") {
    if (isCreate && !managerId) {
      const firstManager = await User.findOne({ role: "manager", isActive: true }).sort({ createdAt: 1 });
      if (!firstManager) {
        const err = new Error("Create an active manager before creating a project");
        err.statusCode = 400;
        throw err;
      }
      ownerId = firstManager._id;
    } else if (managerId !== undefined) {
      const manager = await User.findOne({ _id: managerId, role: "manager", isActive: true });
      if (!manager) {
        const err = new Error("Selected project manager must be an active manager");
        err.statusCode = 400;
        throw err;
      }
      ownerId = manager._id;
    }
  } else {
    ownerId = req.user._id;
  }

  if (selectedEmployeeIds.length === 0) {
    return { ownerId, employeeMemberIds: [] };
  }

  const employees = await User.find({
    _id: { $in: selectedEmployeeIds },
    role: "employee",
    isActive: true,
  }).select("_id");

  if (employees.length !== selectedEmployeeIds.length) {
    const err = new Error("Project members must be active employees");
    err.statusCode = 400;
    throw err;
  }

  return { ownerId, employeeMemberIds: employees.map((employee) => employee._id) };
};

/**
 * @desc    Get all projects visible to the current user
 * @route   GET /api/projects
 * @access  Private
 */
export const getProjects = asyncHandler(async (req, res) => {
  const { search = "", status, page = 1, limit = 9 } = req.query;

  const query = { ...scopeToUser(req.user) };

  if (search) {
    query.$text = { $search: search };
  }
  if (status) {
    query.status = status;
  }

  const pageNum = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit) || 9, 50);

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate("createdBy", "name email avatarColor role")
      .populate("members", "name email avatarColor role")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Project.countDocuments(query),
  ]);

  // Attach task counts for dashboard-style progress bars
  const projectIds = projects.map((p) => p._id);
  const taskCounts = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: { project: "$project", status: "$status" }, count: { $sum: 1 } } },
  ]);

  const countsByProject = {};
  taskCounts.forEach(({ _id, count }) => {
    const pid = _id.project.toString();
    if (!countsByProject[pid]) countsByProject[pid] = { total: 0, done: 0 };
    countsByProject[pid].total += count;
    if (_id.status === "done") countsByProject[pid].done += count;
  });

  const projectsWithProgress = projects.map((p) => {
    const obj = { ...p };
    const counts = countsByProject[p._id.toString()] || { total: 0, done: 0 };
    obj.taskStats = counts;
    return obj;
  });

  res.status(200).json({
    success: true,
    count: projects.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    projects: projectsWithProgress,
  });
});

/**
 * @desc    Get a single project (only if user has access)
 * @route   GET /api/projects/:id
 * @access  Private
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    ...scopeToUser(req.user),
  })
    .populate("createdBy", "name email avatarColor role")
    .populate("members", "name email avatarColor role")
    .lean();

  if (!project) {
    res.status(404);
    throw new Error("Project not found or you don't have access to it");
  }

  res.status(200).json({ success: true, project });
});

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private/Admin,Manager
 */
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, status, dueDate } = req.body;
  const { ownerId, employeeMemberIds } = await resolveProjectPeople({ req, isCreate: true });

  const project = await Project.create({
    name,
    description,
    status,
    dueDate,
    members: employeeMemberIds,
    createdBy: ownerId,
  });

  const populated = await project.populate([
    { path: "createdBy", select: "name email avatarColor role" },
    { path: "members", select: "name email avatarColor role" },
  ]);

  res.status(201).json({ success: true, project: populated });
});

/**
 * @desc    Update a project
 * @route   PUT /api/projects/:id
 * @access  Private/Admin,Manager (manager only if they created it)
 */
export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const isOwner = project.createdBy.equals(req.user._id);
  if (req.user.role === "manager" && !isOwner) {
    res.status(403);
    throw new Error("Only the project's creator can edit this project");
  }

  const { name, description, status, dueDate } = req.body;
  const shouldUpdatePeople = req.body.managerId !== undefined || req.body.employeeIds !== undefined || req.body.members !== undefined;

  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  if (status !== undefined) project.status = status;
  if (dueDate !== undefined) project.dueDate = dueDate;
  if (shouldUpdatePeople) {
    const { ownerId, employeeMemberIds } = await resolveProjectPeople({ req, project });
    project.createdBy = ownerId;
    project.members = employeeMemberIds;
  }

  await project.save();

  const populated = await project.populate([
    { path: "createdBy", select: "name email avatarColor role" },
    { path: "members", select: "name email avatarColor role" },
  ]);

  res.status(200).json({ success: true, project: populated });
});

/**
 * @desc    Delete a project (and its tasks)
 * @route   DELETE /api/projects/:id
 * @access  Private/Admin,Manager (manager only if they created it)
 */
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const isOwner = project.createdBy.equals(req.user._id);
  if (req.user.role === "manager" && !isOwner) {
    res.status(403);
    throw new Error("Only the project's creator can delete this project");
  }

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  res.status(200).json({ success: true, message: "Project and its tasks deleted" });
});
