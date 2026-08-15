import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  FolderKanban,
  ListChecks,
  Users,
  X,
  Boxes,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { closeSidebar } from "../../features/ui/uiSlice";
import RoleBadge from "../common/RoleBadge";
import Avatar from "../common/Avatar";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, roles: ["admin", "manager", "employee"] },
  { to: "/projects", label: "Projects", icon: FolderKanban, roles: ["admin", "manager", "employee"] },
  { to: "/tasks", label: "Tasks", icon: ListChecks, roles: ["admin", "manager", "employee"] },
  { to: "/team", label: "Team", icon: Users, roles: ["admin"] },
];

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
          <Boxes size={18} strokeWidth={2.5} />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">TaskFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={() => dispatch(closeSidebar())}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-white/10">
        <NavLink
          to="/profile"
          onClick={() => dispatch(closeSidebar())}
          className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Avatar name={user?.name} color={user?.avatarColor} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <div className="mt-0.5">
              <RoleBadge role={user?.role} />
            </div>
          </div>
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-slate-900 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => dispatch(closeSidebar())}
          />
          <aside className="relative w-64 h-full bg-slate-900 animate-slide-up">
            <button
              onClick={() => dispatch(closeSidebar())}
              className="absolute top-4 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X size={18} />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
