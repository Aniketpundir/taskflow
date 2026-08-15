import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";

/**
 * Guards nested routes behind a whitelist of roles. Must be used inside
 * <ProtectedRoute> so req.user is guaranteed to exist.
 * Usage: <Route element={<RoleRoute allow={["admin"]} />}>...</Route>
 */
const RoleRoute = ({ allow = [] }) => {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) return null; // ProtectedRoute already handles the redirect

  if (!allow.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
