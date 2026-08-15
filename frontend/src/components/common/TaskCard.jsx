import { Calendar, Pencil, Trash2, MoreVertical } from "lucide-react";
import { memo, useState } from "react";
import { format, isPast } from "date-fns";
import Avatar from "./Avatar";
import StatusPill from "./StatusPill";
import { TASK_PRIORITY_CONFIG } from "../../utils/constants";

const STATUS_FLOW = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "In Review" },
  { value: "done", label: "Done" },
];

/**
 * Renders a single task. `canEditFull` controls whether the edit/delete menu
 * and full edit modal are available (admin/manager), while the status
 * dropdown is available to anyone who can act on the task (including the
 * assignee, per backend rules).
 */
const TaskCard = ({ task, canEditFull, canChangeStatus, onStatusChange, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "done";
  const currentStatusIndex = Math.max(
    STATUS_FLOW.findIndex((status) => status.value === task.status),
    0
  );
  const availableStatuses = STATUS_FLOW.slice(currentStatusIndex);

  return (
    <div className="relative bg-white rounded-lg border border-slate-200 p-4 shadow-sm transition-colors hover:border-brand-200 hover:shadow-md group">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 pr-6 text-sm font-semibold leading-snug text-slate-900">{task.title}</p>
        {canEditFull && (
          <div className="absolute top-3 right-3">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg ring-1 ring-slate-900/5 py-1 z-10">
                <button
                  onClick={() => {
                    onEdit(task);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(task);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {task.description && (
        <p className="mt-2 text-xs leading-5 text-slate-500 line-clamp-3">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPill config={TASK_PRIORITY_CONFIG[task.priority]} />
        {task.dueDate && (
          <span className={`inline-flex items-center gap-1 text-xs ${overdue ? "text-rose-500 font-medium" : "text-slate-400"}`}>
            <Calendar size={11} />
            {format(new Date(task.dueDate), "MMM d")}
          </span>
        )}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        {task.assignedTo ? (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar name={task.assignedTo.name} color={task.assignedTo.avatarColor} size="xs" />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-500">
              {task.assignedTo.name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        )}

        {canChangeStatus ? (
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task, e.target.value)}
            className="mt-3 w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            {availableStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        ) : (
          <StatusPill config={{ label: task.status, bg: "bg-slate-50", text: "text-slate-500" }} />
        )}
      </div>
    </div>
  );
};

export default memo(TaskCard);
