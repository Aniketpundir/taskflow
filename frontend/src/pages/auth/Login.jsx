import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Boxes, Eye, EyeOff, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { loginUser, clearAuthError } from "../../features/auth/authSlice";
import FormField, { inputClass } from "../../components/common/FormField";
import Spinner from "../../components/common/Spinner";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@taskflow.com", password: "Admin@123" },
  { role: "Manager", email: "manager@taskflow.com", password: "Manager@123" },
  { role: "Employee", email: "employee@taskflow.com", password: "Employee@123" },
];

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, token } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (token) {
      navigate(location.state?.from?.pathname || "/", { replace: true });
    }
  }, [token, navigate, location]);

  useEffect(() => {
    if (error) toast.error(error);
    return () => dispatch(clearAuthError());
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  const fillDemo = (email, password) => setForm({ email, password });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left: form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-32">
        <div className="max-w-sm w-full mx-auto">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Boxes size={20} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">TaskFlow</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Sign in to manage your projects and tasks.
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <FormField label="Email" htmlFor="email" required>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className={inputClass()}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FormField>

            <FormField label="Password" htmlFor="password" required>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={inputClass() + " pr-10"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 mt-2"
            >
              {status === "loading" ? <Spinner size={18} /> : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            Accounts are created by an admin from the Team page.
          </p>
        </div>
      </div>

      {/* Right: visual panel */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.15]" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-600/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-md px-10">
          <p className="text-brand-400 text-sm font-semibold tracking-wide uppercase mb-4">
            Built for teams
          </p>
          <h2 className="text-3xl font-bold text-white leading-tight">
            One workspace. Three roles. Zero confusion.
          </h2>
          <p className="text-slate-400 mt-4 leading-relaxed">
            Admins govern access, managers run the work, and employees stay focused on
            what's assigned to them — each sees exactly what they need, nothing more.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {[
              { role: "Admin", desc: "Full control over users, roles & every project" },
              { role: "Manager", desc: "Creates projects and assigns work to the team" },
              { role: "Employee", desc: "Focused view of assigned tasks and updates" },
            ].map((item) => (
              <div key={item.role} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{item.role}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
