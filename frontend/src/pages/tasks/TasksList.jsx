import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, ListChecks } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchTasks, updateTask, deleteTask, setTaskFilters } from "../../features/tasks/taskSlice";
import { fetchAssignableUsers } from "../../features/users/userSlice";
import Topbar from "../../components/layout/Topbar";
import TaskCard from "../../components/common/TaskCard";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";
import TaskFormModal from "./TaskFormModal";

const TasksList = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items, status, total, page, totalPages, filters } = useAppSelector((state) => state.tasks);
  const { assignable } = useAppSelector((state) => state.users);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [editingTask, setEditingTask] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canManageTasks = user?.role === "admin" || user?.role === "manager";

  const load = useCallback(
    (params = {}) => {
      dispatch(fetchTasks({ ...filters, page: 1, limit: 12, ...params }));
    },
    [dispatch, filters]
  );

  useEffect(() => {
    load();
    if (canManageTasks) dispatch(fetchAssignableUsers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.priority]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(setTaskFilters({ search: searchInput }));
      load({ search: searchInput });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handlePageChange = (newPage) => {
    dispatch(fetchTasks({ ...filters, page: newPage, limit: 12 }));
  };

  const handleStatusChange = async (task, statusValue) => {
    try {
      await dispatch(updateTask({ id: task._id, payload: { status: statusValue } })).unwrap();
    } catch (err) {
      toast.error(err || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteTask(deleteTarget._id)).unwrap();
      toast.success("Task deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err || "Failed to delete task");
    }
  };

  const canUserActOnTask = (task) => canManageTasks || task.assignedTo?._id === user?._id;

  return (
    <>
      <Topbar
        title={user?.role === "employee" ? "My Tasks" : "All Tasks"}
        subtitle={`${total} task${total !== 1 ? "s" : ""}${user?.role === "employee" ? " assigned to you" : " across your projects"}`}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            value={filters.status}
            onChange={(e) => dispatch(setTaskFilters({ status: e.target.value }))}
          >
            <option value="">All statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="done">Done</option>
          </select>
          <select
            className="px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            value={filters.priority}
            onChange={(e) => dispatch(setTaskFilters({ priority: e.target.value }))}
          >
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {status === "loading" ? (
          <PageLoader />
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200">
            <EmptyState
              icon={ListChecks}
              title="No tasks found"
              description={
                user?.role === "employee"
                  ? "Tasks assigned to you will show up here."
                  : "Create tasks from within a project to see them here."
              }
              action={
                <Link
                  to="/projects"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Go to projects &rarr;
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((task) => (
                <div key={task._id}>
                  {task.project && (
                    <Link
                      to={`/projects/${task.project._id}`}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 mb-1.5 inline-block"
                    >
                      {task.project.name}
                    </Link>
                  )}
                  <TaskCard
                    task={task}
                    canEditFull={canManageTasks}
                    canChangeStatus={canUserActOnTask(task)}
                    onStatusChange={handleStatusChange}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setFormOpen(true);
                    }}
                    onDelete={setDeleteTarget}
                  />
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} itemLabel="tasks" onPageChange={handlePageChange} />
          </>
        )}
      </div>

      {editingTask && (
        <TaskFormModal
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          task={editingTask}
          members={assignable}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete task"
        message={`Delete "${deleteTarget?.title}"? This action can't be undone.`}
        confirmLabel="Delete task"
      />
    </>
  );
};

export default TasksList;
