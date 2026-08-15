// Single source of truth for role display — keeps colors/labels consistent
// across avatars, badges, sidebar, and filters.
export const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    color: "#7c3aed",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    dot: "bg-violet-500",
  },
  manager: {
    label: "Manager",
    color: "#0284c7",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  employee: {
    label: "Employee",
    color: "#059669",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
};

export const TASK_STATUS_CONFIG = {
  todo: { label: "To Do", bg: "bg-slate-100", text: "text-slate-600" },
  "in-progress": { label: "In Progress", bg: "bg-amber-50", text: "text-amber-700" },
  review: { label: "In Review", bg: "bg-violet-50", text: "text-violet-700" },
  done: { label: "Done", bg: "bg-emerald-50", text: "text-emerald-700" },
};

export const TASK_PRIORITY_CONFIG = {
  low: { label: "Low", bg: "bg-slate-100", text: "text-slate-600" },
  medium: { label: "Medium", bg: "bg-sky-50", text: "text-sky-700" },
  high: { label: "High", bg: "bg-orange-50", text: "text-orange-700" },
  urgent: { label: "Urgent", bg: "bg-rose-50", text: "text-rose-700" },
};

export const PROJECT_STATUS_CONFIG = {
  planning: { label: "Planning", bg: "bg-slate-100", text: "text-slate-600" },
  active: { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700" },
  "on-hold": { label: "On Hold", bg: "bg-amber-50", text: "text-amber-700" },
  completed: { label: "Completed", bg: "bg-sky-50", text: "text-sky-700" },
};
