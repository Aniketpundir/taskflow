import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Users, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchUsers, deleteUser, setUserFilters } from "../../features/users/userSlice";
import Topbar from "../../components/layout/Topbar";
import Avatar from "../../components/common/Avatar";
import RoleBadge from "../../components/common/RoleBadge";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";
import UserFormModal from "./UserFormModal";
import { format } from "date-fns";

const UsersList = () => {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { items, status, total, page, totalPages, filters } = useAppSelector((state) => state.users);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(
    (params = {}) => {
      dispatch(fetchUsers({ ...filters, page: 1, ...params }));
    },
    [dispatch, filters]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.role]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(setUserFilters({ search: searchInput }));
      load({ search: searchInput });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleDelete = async () => {
    try {
      await dispatch(deleteUser(deleteTarget._id)).unwrap();
      toast.success("User removed");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err || "Failed to remove user");
    }
  };

  return (
    <>
      <Topbar
        title="Team"
        subtitle={`${total} member${total !== 1 ? "s" : ""} in your workspace`}
        actions={
          <button
            onClick={() => {
              setEditingUser(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Add Member</span>
          </button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            value={filters.role}
            onChange={(e) => dispatch(setUserFilters({ role: e.target.value }))}
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </div>

        {status === "loading" ? (
          <PageLoader />
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200">
            <EmptyState icon={Users} title="No team members found" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Member</th>
                  <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Role</th>
                  <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide hidden sm:table-cell">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} color={u.avatarColor} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate">
                            {u.name} {u._id === currentUser?._id && <span className="text-slate-400 font-normal">(you)</span>}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          u.isActive ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                        {u.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">
                      {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                          <Pencil size={14} />
                        </button>
                        {u._id !== currentUser?._id && (
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                itemLabel="members"
                onPageChange={(p) => dispatch(fetchUsers({ ...filters, page: p }))}
              />
            </div>
          </div>
        )}
      </div>

      <UserFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} targetUser={editingUser} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove team member"
        message={`Remove ${deleteTarget?.name} from the workspace? They will lose access immediately.`}
        confirmLabel="Remove member"
      />
    </>
  );
};

export default UsersList;
