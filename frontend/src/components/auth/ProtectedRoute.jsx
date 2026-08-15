import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";

/**
 * Guards nested routes behind authentication. Unauthenticated users are
 * redirected to /login, remembering where they were headed so we can
 * send them back after a successful login.
 */
const ProtectedRoute = () => {
  const { token } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
