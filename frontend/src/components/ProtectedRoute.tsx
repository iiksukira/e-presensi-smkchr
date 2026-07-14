/** @format */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  getLoginRouteFromPath,
  getLoginRouteFromRoles,
  getLoginRouteFromRole,
} from "../utils/authRoutes";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const location = useLocation();
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const loginRoute =
    (user.role && getLoginRouteFromRole(user.role)) ||
    getLoginRouteFromPath(location.pathname) ||
    getLoginRouteFromRoles(allowedRoles);

  if (!token) return <Navigate to={loginRoute} replace />;
  if (!allowedRoles.includes(user.role))
    return <Navigate to={getLoginRouteFromRole(user.role)} replace />;

  return <Outlet />;
};

export default ProtectedRoute;
