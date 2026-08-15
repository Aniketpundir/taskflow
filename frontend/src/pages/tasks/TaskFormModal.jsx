import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../../components/common/Modal";
import FormField, { inputClass } from "../../components/common/FormField";
import Spinner from "../../components/common/Spinner";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { createTask, updateTask } from "../../features/tasks/taskSlice";

const emptyForm = {
  title: "",
  description: "",
  assignedTo: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
};

/**
 * Used both from a Project detail page (projectId is fixed) and could be
 * extended for a global task creation flow. `members` is the list of users
 * eligible for assignment (usually the project's member list).
 */
const TaskFormModal = ({ isOpen, onClose, task, projectId, members = [] }) => {
  const dispatch = useAppDispatch();
  const { actionStatus } = useAppSelector((state) => state.tasks);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || "",
        assignedTo: task.assignedTo?._id || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [task, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      assignedTo: form.assignedTo || null,
      dueDate: form.dueDate || null,
      ...(task ? {} : { project: projectId }),
    };

    try {
      if (task) {
        await dispatch(updateTask({ id: task._id, payload })).unwrap();
        toast.success("Task updated");
      } else {
        await dispatch(createTask(payload)).unwrap();
        toast.success("Task created");
      }
      onClose();
    } catch (err) {
      toast.error(err || "Something went wrong");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? "Edit Task" : "New Task"} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit}>
        <FormField label="Task title" htmlFor="title" required>
          <input
            id="title"
            required
            placeholder="e.g. Design the onboarding flow"
            className={inputClass()}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <textarea
            id="description"
            rows={3}
            placeholder="Add more context for this task..."
            className={inputClass()}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormField>

        <FormField label="Assign to" htmlFor="assignedTo">
          <select
            id="assignedTo"
            className={inputClass()}
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-3 gap-3">
          <FormField label="Status" htmlFor="status">
            <select
              id="status"
              className={inputClass()}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="done">Done</option>
            </select>
          </FormField>

          <FormField label="Priority" htmlFor="priority">
            <select
              id="priority"
              className={inputClass()}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </FormField>

          <FormField label="Due date" htmlFor="dueDate">
            <input
              id="dueDate"
              type="date"
              className={inputClass()}
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionStatus === "loading"}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {actionStatus === "loading" && <Spinner size={14} />}
            {task ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskFormModal;
