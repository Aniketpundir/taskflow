import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Calendar, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchProjectById, clearCurrentProject, deleteProject } from "../../features/projects/projectSlice";
import { fetchTasks, updateTask, deleteTask } from "../../features/tasks/taskSlice";
import Topbar from "../../components/layout/Topbar";
import Avatar from "../../components/common/Avatar";
import StatusPill from "../../components/common/StatusPill";
import TaskCard from "../../components/common/TaskCard";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";
import { PROJECT_STATUS_CONFIG } from "../../utils/constants";
import { format } from "date-fns";
import ProjectFormModal from "./ProjectFormModal";
import TaskFormModal from "../tasks/TaskFormModal";

const COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "in-progress", label: "In Progress" },
  { key: "review", label: "In Review" },
  { key: "done", label: "Done" },
];

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);
  const { currentProject: project, status: projectStatus } = useAppSelector((state) => state.projects);
  const { items: tasks, status: taskStatus } = useAppSelector((state) => state.tasks);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchProjectById(id));
    dispatch(fetchTasks({ project: id, limit: 100 }));
    return () => dispatch(clearCurrentProject());
  }, [dispatch, id]);

  const canManageProject =
    user?.role === "admin" || (user?.role === "manager" && project?.createdBy?._id === user?._id);
  const canManageTasks = user?.role === "admin" || user?.role === "manager";

  const tasksByStatus = useMemo(
    () =>
      tasks.reduce((groups, task) => {
        if (!groups[task.status]) groups[task.status] = [];
        groups[task.status].push(task);
        return groups;
      }, {}),
    [tasks]
  );

  const handleStatusChange = useCallback(async (task, status) => {
    try {
      await dispatch(updateTask({ id: task._id, payload: { status } })).unwrap();
    } catch (err) {
      toast.error(err || "Failed to update status");
    }
  }, [dispatch]);

  const handleDeleteTask = async () => {
    try {
      await dispatch(deleteTask(deleteTaskTarget._id)).unwrap();
      toast.success("Task deleted");
      setDeleteTaskTarget(null);
    } catch (err) {
      toast.error(err || "Failed to delete task");
    }
  };

  const handleDeleteProject = async () => {
    try {
      await dispatch(deleteProject(project._id)).unwrap();
      toast.success("Project deleted");
      navigate("/projects");
    } catch (err) {
      toast.error(err || "Failed to delete project");
    }
  };

  const canUserActOnTask = useCallback(
    (task) => canManageTasks || task.assignedTo?._id === user?._id,
    [canManageTasks, user?._id]
  );

  if (projectStatus === "loading" || !project) {
    return (
      <>
        <Topbar title="Project" />
        <PageLoader />
      </>
    );
  }

  return (
    <>
      <Topbar
        title={project.name}
        subtitle="Project overview and task board"
        actions={
          canManageProject && (
            <>
              <button
                onClick={() => setEditProjectOpen(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors"
              >
                <Pencil size={15} /> <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => setDeleteProjectOpen(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors"
              >
                <Trash2 size={15} /> <span className="hidden sm:inline">Delete</span>
              </button>
            </>
          )
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft size={15} /> Back to projects
        </button>

        {/* Project summary card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <StatusPill config={PROJECT_STATUS_CONFIG[project.status]} size="md" />
              <p className="text-sm text-slate-600 mt-3 max-w-2xl">
                {project.description || "No description provided for this project."}
              </p>
            </div>
            {project.dueDate && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 shrink-0">
                <Calendar size={15} /> Due {format(new Date(project.dueDate), "MMMM d, yyyy")}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-5 pt-5 border-t border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Team</p>
              <div className="flex items-center gap-2">
                {project.members?.length > 0 ? (
                  <div className="flex -space-x-2">
                    {project.members.map((m) => (
                      <Avatar key={m._id} name={m.name} color={m.avatarColor} size="sm" />
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">No members added</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Owner</p>
              <p className="text-sm font-medium text-slate-700">{project.createdBy?.name}</p>
            </div>
          </div>
        </div>

        {/* Task board */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Tasks</h2>
          {canManageTasks && (
            <button
              onClick={() => {
                setEditingTask(null);
                setTaskFormOpen(true);
              }}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} /> New Task
            </button>
          )}
        </div>

        {taskStatus === "loading" ? (
          <PageLoader />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => {
              const colTasks = tasksByStatus[col.key] || [];
              return (
                <div key={col.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {col.label}
                    </h3>
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="min-h-64 space-y-3">
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        canEditFull={canManageTasks}
                        canChangeStatus={canUserActOnTask(task)}
                        onStatusChange={handleStatusChange}
                        onEdit={(t) => {
                          setEditingTask(t);
                          setTaskFormOpen(true);
                        }}
                        onDelete={setDeleteTaskTarget}
                      />
                    ))}
                    {colTasks.length === 0 && (
                      <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/50 px-4 text-center">
                        <p className="text-sm text-slate-400">No tasks</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProjectFormModal isOpen={editProjectOpen} onClose={() => setEditProjectOpen(false)} project={project} />

      <TaskFormModal
        isOpen={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        task={editingTask}
        projectId={project._id}
        members={project.members || []}
      />

      <ConfirmDialog
        isOpen={!!deleteTaskTarget}
        onClose={() => setDeleteTaskTarget(null)}
        onConfirm={handleDeleteTask}
        title="Delete task"
        message={`Delete "${deleteTaskTarget?.title}"? This action can't be undone.`}
        confirmLabel="Delete task"
      />

      <ConfirmDialog
        isOpen={deleteProjectOpen}
        onClose={() => setDeleteProjectOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete project"
        message={`Delete "${project.name}"? All of its tasks will be permanently deleted too.`}
        confirmLabel="Delete project"
      />
    </>
  );
};

export default ProjectDetail;
