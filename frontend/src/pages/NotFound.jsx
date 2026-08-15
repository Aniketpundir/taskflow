import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-5">
      <Compass size={30} />
    </div>
    <h1 className="text-xl font-bold text-slate-900">Page not found</h1>
    <p className="text-sm text-slate-500 mt-2 max-w-sm">
      The page you're looking for doesn't exist or may have been moved.
    </p>
    <Link
      to="/"
      className="mt-6 px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
    >
      Back to dashboard
    </Link>
  </div>
);

export default NotFound;
