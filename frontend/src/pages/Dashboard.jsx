import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, ListChecks, Users, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchProjects } from "../features/projects/projectSlice";
import { fetchTasks } from "../features/tasks/taskSlice";
import { fetchUsers } from "../features/users/userSlice";
import Topbar from "../components/layout/Topbar";
import StatusPill from "../components/common/StatusPill";
import Avatar from "../components/common/Avatar";
import ProgressBar from "../components/common/ProgressBar";
import EmptyState from "../components/common/EmptyState";
import { PageLoader } from "../components/common/Spinner";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG, PROJECT_STATUS_CONFIG } from "../utils/constants";
import { format } from "date-fns";

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5">
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-500">{label}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon size={17} />
      </div>
    </div>
    <p className="text-2xl font-bold text-slate-900 mt-3">{value}</p>
  </div>
);

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items: projects, status: projStatus } = useAppSelector((state) => state.projects);
  const { items: tasks, status: taskStatus } = useAppSelector((state) => state.tasks);
  const { total: userTotal } = useAppSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchProjects({ limit: 6 }));
    dispatch(fetchTasks({ limit: 8 }));
    if (user?.role === "admin") dispatch(fetchUsers({ limit: 1 }));
  }, [dispatch, user?.role]);

  const isLoading = projStatus === "loading" || taskStatus === "loading";

  const taskStats = useMemo(() => {
    const now = new Date();
    return tasks.reduce(
      (stats, task) => {
        if (task.status === "done") stats.done += 1;
        if (task.status === "in-progress") stats.inProgress += 1;
        if (task.dueDate && new Date(task.dueDate) < now && task.status !== "done") {
          stats.overdue += 1;
        }
        return stats;
      },
      { done: 0, inProgress: 0, overdue: 0 }
    );
  }, [tasks]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <>
      <Topbar title={`${greeting()}, ${user?.name?.split(" ")[0]}`} subtitle="Here's what's happening across your workspace." />

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {isLoading ? (
          <PageLoader />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={FolderKanban}
                label={user?.role === "employee" ? "My Projects" : "Total Projects"}
                value={projects.length}
                accent="bg-brand-50 text-brand-600"
              />
              <StatCard
                icon={ListChecks}
                label="In Progress"
                value={taskStats.inProgress}
                accent="bg-amber-50 text-amber-600"
              />
              <StatCard
                icon={CheckCircle2}
                label="Completed Tasks"
                value={taskStats.done}
                accent="bg-emerald-50 text-emerald-600"
              />
              {user?.role === "admin" ? (
                <StatCard
                  icon={Users}
                  label="Team Members"
                  value={userTotal}
                  accent="bg-sky-50 text-sky-600"
                />
              ) : (
                <StatCard
                  icon={Clock}
                  label="Overdue"
                  value={taskStats.overdue}
                  accent="bg-rose-50 text-rose-600"
                />
              )}
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
              {/* Projects */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900 text-sm">Recent Projects</h2>
                  <Link to="/projects" className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    View all <ArrowUpRight size={13} />
                  </Link>
                </div>
                {projects.length === 0 ? (
                  <EmptyState
                    icon={FolderKanban}
                    title="No projects yet"
                    description="Projects you own or belong to will show up here."
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {projects.slice(0, 5).map((p) => (
                      <Link
                        key={p._id}
                        to={`/projects/${p._id}`}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1 mr-4">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                            <StatusPill config={PROJECT_STATUS_CONFIG[p.status]} />
                          </div>
                          <div className="mt-2 max-w-[220px]">
                            <ProgressBar done={p.taskStats?.done || 0} total={p.taskStats?.total || 0} />
                          </div>
                        </div>
                        <div className="flex -space-x-2 shrink-0">
                          {p.members?.slice(0, 3).map((m) => (
                            <Avatar key={m._id} name={m.name} color={m.avatarColor} size="xs" />
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900 text-sm">
                    {user?.role === "employee" ? "My Tasks" : "Recent Tasks"}
                  </h2>
                  <Link to="/tasks" className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    View all <ArrowUpRight size={13} />
                  </Link>
                </div>
                {tasks.length === 0 ? (
                  <EmptyState
                    icon={ListChecks}
                    title="No tasks yet"
                    description="Tasks assigned to you will appear here."
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {tasks.slice(0, 6).map((t) => (
                      <div key={t._id} className="px-5 py-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-slate-800 leading-snug">{t.title}</p>
                          <StatusPill config={TASK_PRIORITY_CONFIG[t.priority]} />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <StatusPill config={TASK_STATUS_CONFIG[t.status]} />
                          {t.dueDate && (
                            <span className="text-xs text-slate-400">
                              Due {format(new Date(t.dueDate), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Dashboard;
