import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import Modal from "../../components/common/Modal";
import FormField, { inputClass } from "../../components/common/FormField";
import Avatar from "../../components/common/Avatar";
import Spinner from "../../components/common/Spinner";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { createProject, updateProject } from "../../features/projects/projectSlice";
import { fetchAssignableUsers } from "../../features/users/userSlice";
import { Check, Search, UserRound, UsersRound } from "lucide-react";

const emptyForm = {
  name: "",
  description: "",
  status: "planning",
  managerId: "",
  employeeIds: [],
  dueDate: "",
};

const optionBaseClass =
  "w-full flex items-center gap-3 px-3.5 py-3 transition-colors text-left focus:outline-none focus:bg-brand-50";

const selectedOptionClass = "bg-brand-50/80 hover:bg-brand-50";
const idleOptionClass = "hover:bg-slate-50";

const SelectionMark = ({ selected }) => (
  <div
    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
      selected ? "bg-brand-600 border-brand-600 text-white" : "border-slate-300 bg-white"
    }`}
  >
    {selected && <Check size={13} strokeWidth={3} />}
  </div>
);

const ProjectFormModal = ({ isOpen, onClose, project }) => {
  const dispatch = useAppDispatch();
  const { assignable } = useAppSelector((state) => state.users);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { actionStatus } = useAppSelector((state) => state.projects);
  const [form, setForm] = useState(emptyForm);
  const [peopleTab, setPeopleTab] = useState("manager");
  const [peopleSearch, setPeopleSearch] = useState("");

  const managers = useMemo(() => assignable.filter((u) => u.role === "manager"), [assignable]);
  const employees = useMemo(() => assignable.filter((u) => u.role === "employee"), [assignable]);
  const filteredManagers = useMemo(
    () =>
      managers.filter((manager) =>
        `${manager.name} ${manager.email}`.toLowerCase().includes(peopleSearch.trim().toLowerCase())
      ),
    [managers, peopleSearch]
  );
  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) =>
        `${employee.name} ${employee.email}`.toLowerCase().includes(peopleSearch.trim().toLowerCase())
      ),
    [employees, peopleSearch]
  );

  useEffect(() => {
    if (isOpen) dispatch(fetchAssignableUsers());
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        description: project.description || "",
        status: project.status,
        managerId: project.createdBy?.role === "manager" ? project.createdBy._id : "",
        employeeIds: project.members?.filter((m) => m.role === "employee").map((m) => m._id) || [],
        dueDate: project.dueDate ? project.dueDate.slice(0, 10) : "",
      });
    } else {
      setForm({
        ...emptyForm,
        managerId: currentUser?.role === "manager" ? currentUser._id : "",
      });
    }
    setPeopleTab("manager");
    setPeopleSearch("");
  }, [project, isOpen, currentUser]);

  const toggleEmployee = (id) => {
    setForm((f) => ({
      ...f,
      employeeIds: f.employeeIds.includes(id)
        ? f.employeeIds.filter((employeeId) => employeeId !== id)
        : [...f.employeeIds, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentUser?.role === "admin" && !form.managerId) {
      toast.error("Select one manager for this project");
      setPeopleTab("manager");
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      status: form.status,
      dueDate: form.dueDate || null,
      managerId: currentUser?.role === "admin" ? form.managerId : undefined,
      employeeIds: form.employeeIds,
    };

    try {
      if (project) {
        await dispatch(updateProject({ id: project._id, payload })).unwrap();
        toast.success("Project updated");
      } else {
        await dispatch(createProject(payload)).unwrap();
        toast.success("Project created");
      }
      onClose();
    } catch (err) {
      toast.error(err || "Something went wrong");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project ? "Edit Project" : "New Project"} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-1">
        <FormField label="Project name" htmlFor="name" required>
          <input
            id="name"
            required
            placeholder="e.g. Mobile App Redesign"
            className={inputClass()}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <textarea
            id="description"
            rows={3}
            placeholder="What is this project about?"
            className={inputClass()}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Status" htmlFor="status">
            <select
              id="status"
              className={inputClass()}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
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

        <FormField label="Project team" hint="Select one manager and any number of employees">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 bg-slate-50 p-1">
            {[
              { id: "manager", label: "Manager", count: form.managerId ? 1 : 0, icon: UserRound },
              { id: "employees", label: "Employees", count: form.employeeIds.length, icon: UsersRound },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setPeopleTab(tab.id);
                  setPeopleSearch("");
                }}
                className={`flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  peopleTab === tab.id
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <tab.icon size={15} className="shrink-0" />
                <span className="truncate">{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
                    peopleTab === tab.id ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
            </div>

            <div className="border-t border-slate-200 bg-white p-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={peopleSearch}
                  onChange={(e) => setPeopleSearch(e.target.value)}
                  placeholder={peopleTab === "manager" ? "Search managers..." : "Search employees..."}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div className="max-h-56 min-h-24 overflow-y-auto scrollbar-thin divide-y divide-slate-100">
            {peopleTab === "manager" && currentUser?.role === "manager" && (
              <div className={`${optionBaseClass} ${selectedOptionClass}`}>
                <Avatar name={currentUser.name} color={currentUser.avatarColor} size="xs" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800 truncate">{currentUser.name}</p>
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                      Manager
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">You will manage this project</p>
                </div>
                <SelectionMark selected />
              </div>
            )}

            {peopleTab === "manager" && currentUser?.role === "admin" && (
              managers.length === 0 ? (
                <div className="flex min-h-24 items-center justify-center px-4 py-6 text-center">
                  <p className="text-sm text-slate-400">No managers available yet.</p>
                </div>
              ) : filteredManagers.length === 0 ? (
                <div className="flex min-h-24 items-center justify-center px-4 py-6 text-center">
                  <p className="text-sm text-slate-400">No managers match your search.</p>
                </div>
              ) : (
                filteredManagers.map((manager) => (
                  <button
                    type="button"
                    key={manager._id}
                    onClick={() => setForm({ ...form, managerId: manager._id })}
                    className={`${optionBaseClass} ${
                      form.managerId === manager._id ? selectedOptionClass : idleOptionClass
                    }`}
                  >
                    <Avatar name={manager.name} color={manager.avatarColor} size="xs" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 truncate">{manager.name}</p>
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                          Manager
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{manager.email}</p>
                    </div>
                    <SelectionMark selected={form.managerId === manager._id} />
                  </button>
                ))
              )
            )}

            {peopleTab === "employees" && (
              employees.length === 0 ? (
                <div className="flex min-h-24 items-center justify-center px-4 py-6 text-center">
                  <p className="text-sm text-slate-400">No employees available yet.</p>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="flex min-h-24 items-center justify-center px-4 py-6 text-center">
                  <p className="text-sm text-slate-400">No employees match your search.</p>
                </div>
              ) : (
                filteredEmployees.map((employee) => (
                  <button
                    type="button"
                    key={employee._id}
                    onClick={() => toggleEmployee(employee._id)}
                    className={`${optionBaseClass} ${
                      form.employeeIds.includes(employee._id) ? selectedOptionClass : idleOptionClass
                    }`}
                  >
                    <Avatar name={employee.name} color={employee.avatarColor} size="xs" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 truncate">{employee.name}</p>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          Employee
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{employee.email}</p>
                    </div>
                    <SelectionMark selected={form.employeeIds.includes(employee._id)} />
                  </button>
                ))
              )
            )}
            </div>
          </div>
        </FormField>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={actionStatus === "loading"}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {actionStatus === "loading" && <Spinner size={14} />}
            {project ? "Save changes" : "Create project"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectFormModal;
