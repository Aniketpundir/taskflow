import { useAppSelector } from "../app/hooks";
import Topbar from "../components/layout/Topbar";
import Avatar from "../components/common/Avatar";
import RoleBadge from "../components/common/RoleBadge";
import { format } from "date-fns";
import { ShieldCheck, Mail, Calendar } from "lucide-react";

const ROLE_PERMISSIONS = {
  admin: [
    "Manage all users — create, edit roles, deactivate, or remove accounts",
    "Full access to every project and task across the workspace",
    "Create, edit, and delete any project or task",
  ],
  manager: [
    "Create new projects and add team members to them",
    "Create, assign, and manage tasks within their own projects",
    "Edit or delete only the projects they created",
  ],
  employee: [
    "View projects they've been added to as a member",
    "See tasks assigned to them",
    "Update the status of their own assigned tasks",
  ],
};

const Profile = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <>
      <Topbar title="Profile" subtitle="Your account details and permissions" />

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name} color={user?.avatarColor} size="lg" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              <div className="mt-1.5">
                <RoleBadge role={user?.role} size="md" />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <Mail size={16} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm font-medium text-slate-700">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Member since</p>
                <p className="text-sm font-medium text-slate-700">
                  {user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-brand-600" />
            <h3 className="font-semibold text-slate-900 text-sm">What your role can do</h3>
          </div>
          <ul className="space-y-2.5">
            {ROLE_PERMISSIONS[user?.role]?.map((perm, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                {perm}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Profile;
