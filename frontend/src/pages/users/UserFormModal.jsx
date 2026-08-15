import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../../components/common/Modal";
import FormField, { inputClass } from "../../components/common/FormField";
import Spinner from "../../components/common/Spinner";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { createUser, updateUser } from "../../features/users/userSlice";

const emptyForm = { name: "", email: "", password: "", role: "employee", isActive: true };

const UserFormModal = ({ isOpen, onClose, targetUser }) => {
  const dispatch = useAppDispatch();
  const { actionStatus } = useAppSelector((state) => state.users);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (targetUser) {
      setForm({
        name: targetUser.name,
        email: targetUser.email,
        password: "",
        role: targetUser.role,
        isActive: targetUser.isActive,
      });
    } else {
      setForm(emptyForm);
    }
  }, [targetUser, isOpen]);

  const isSelf = targetUser?._id === currentUser?._id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (targetUser) {
        await dispatch(
          updateUser({
            id: targetUser._id,
            payload: { name: form.name, role: form.role, isActive: form.isActive },
          })
        ).unwrap();
        toast.success("User updated");
      } else {
        await dispatch(createUser(form)).unwrap();
        toast.success("User created");
      }
      onClose();
    } catch (err) {
      toast.error(err || "Something went wrong");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={targetUser ? "Edit Team Member" : "Add Team Member"} maxWidth="max-w-md">
      <form onSubmit={handleSubmit}>
        <FormField label="Full name" htmlFor="name" required>
          <input
            id="name"
            required
            className={inputClass()}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" required>
          <input
            id="email"
            type="email"
            required
            disabled={!!targetUser}
            className={inputClass() + (targetUser ? " bg-slate-50 text-slate-400" : "")}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </FormField>

        {!targetUser && (
          <FormField label="Temporary password" htmlFor="password" required hint="At least 6 characters">
            <input
              id="password"
              type="password"
              required
              minLength={6}
              className={inputClass()}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Role" htmlFor="role" required>
            <select
              id="role"
              disabled={isSelf}
              className={inputClass() + (isSelf ? " bg-slate-50 text-slate-400" : "")}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              {targetUser && <option value="admin">Admin</option>}
            </select>
          </FormField>

          {targetUser && (
            <FormField label="Status" htmlFor="isActive">
              <select
                id="isActive"
                disabled={isSelf}
                className={inputClass() + (isSelf ? " bg-slate-50 text-slate-400" : "")}
                value={form.isActive ? "active" : "inactive"}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
              >
                <option value="active">Active</option>
                <option value="inactive">Deactivated</option>
              </select>
            </FormField>
          )}
        </div>

        {isSelf && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 -mt-1 mb-4">
            You can't change your own role or status.
          </p>
        )}

        <div className="flex justify-end gap-2 mt-2">
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
            {targetUser ? "Save changes" : "Add member"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;
