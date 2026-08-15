import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, FolderKanban, Calendar, MoreVertical, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchProjects, deleteProject, setProjectFilters } from "../../features/projects/projectSlice";
import Topbar from "../../components/layout/Topbar";
import StatusPill from "../../components/common/StatusPill";
import Avatar from "../../components/common/Avatar";
import ProgressBar from "../../components/common/ProgressBar";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";
import { PROJECT_STATUS_CONFIG } from "../../utils/constants";
import { format } from "date-fns";
import ProjectFormModal from "./ProjectFormModal";

const ProjectsList = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items, status, total, page, totalPages, filters } = useAppSelector((state) => state.projects);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const canManage = user?.role === "admin" || user?.role === "manager";

  const load = useCallback(
    (params = {}) => {
      dispatch(fetchProjects({ ...filters, page: 1, ...params }));
    },
    [dispatch, filters]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(setProjectFilters({ search: searchInput }));
      load({ search: searchInput });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handlePageChange = (newPage) => {
    dispatch(fetchProjects({ ...filters, page: newPage }));
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteProject(deleteTarget._id)).unwrap();
      toast.success("Project deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err || "Failed to delete project");
    }
  };

  const openCreate = () => {
    setEditingProject(null);
    setFormOpen(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setFormOpen(true);
    setOpenMenuId(null);
  };

  return (
    <>
      <Topbar
        title="Projects"
        subtitle={`${total} project${total !== 1 ? "s" : ""} in your workspace`}
        actions={
          canManage && (
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} /> <span className="hidden sm:inline">New Project</span>
            </button>
          )
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search projects..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            value={filters.status}
            onChange={(e) => dispatch(setProjectFilters({ status: e.target.value }))}
          >
            <option value="">All statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {status === "loading" ? (
          <PageLoader />
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200">
            <EmptyState
              icon={FolderKanban}
              title="No projects found"
              description={
                canManage
                  ? "Create your first project to start organizing work for your team."
                  : "You haven't been added to any projects yet."
              }
              action={
                canManage && (
                  <button
                    onClick={openCreate}
                    className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus size={16} /> New Project
                  </button>
                )
              }
            />
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((project) => (
                <div
                  key={project._id}
                  className="relative bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all group"
                >
                  <Link to={`/projects/${project._id}`} className="block p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug pr-6">{project.name}</h3>
                    </div>
                    <StatusPill config={PROJECT_STATUS_CONFIG[project.status]} />
                    <p className="text-sm text-slate-500 mt-2.5 line-clamp-2 min-h-[2.5rem]">
                      {project.description || "No description provided."}
                    </p>

                    <div className="mt-4">
                      <ProgressBar done={project.taskStats?.done || 0} total={project.taskStats?.total || 0} />
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <div className="flex -space-x-2">
                        {project.members?.slice(0, 4).map((m) => (
                          <Avatar key={m._id} name={m.name} color={m.avatarColor} size="xs" />
                        ))}
                        {project.members?.length === 0 && (
                          <span className="text-xs text-slate-400">No members yet</span>
                        )}
                      </div>
                      {project.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar size={12} />
                          {format(new Date(project.dueDate), "MMM d")}
                        </div>
                      )}
                    </div>
                  </Link>

                  {(user?.role === "admin" ||
                    (user?.role === "manager" && project.createdBy?._id === user?._id)) && (
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === project._id ? null : project._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openMenuId === project._id && (
                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg ring-1 ring-slate-900/5 py-1 z-10">
                          <button
                            onClick={() => openEdit(project)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(project);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} total={total} itemLabel="projects" onPageChange={handlePageChange} />
          </>
        )}
      </div>

      <ProjectFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} project={editingProject} />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all of its tasks. This action can't be undone.`}
        confirmLabel="Delete project"
      />
    </>
  );
};

export default ProjectsList;
