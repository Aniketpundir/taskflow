import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const Forbidden = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
    <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-5">
      <ShieldAlert size={30} />
    </div>
    <h1 className="text-xl font-bold text-slate-900">Access restricted</h1>
    <p className="text-sm text-slate-500 mt-2 max-w-sm">
      Your current role doesn't have permission to view this page. If you think this is a
      mistake, contact your workspace admin.
    </p>
    <Link
      to="/"
      className="mt-6 px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
    >
      Back to dashboard
    </Link>
  </div>
);

export default Forbidden;
