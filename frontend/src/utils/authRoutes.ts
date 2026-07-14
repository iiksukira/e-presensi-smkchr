/** @format */

export const getLoginRouteFromRole = (role: string) => {
  switch (role) {
    case "admin":
      return "/admin/login";
    case "guru":
      return "/teacher/login";
    case "siswa":
      return "/student/login";
    case "ortu":
    case "orangtua":
      return "/parent/login";
    default:
      return "/login";
  }
};

export const getLoginRouteFromPath = (pathname: string) => {
  if (pathname.startsWith("/admin")) return "/admin/login";
  if (pathname.startsWith("/teacher")) return "/teacher/login";
  if (pathname.startsWith("/student")) return "/student/login";
  if (pathname.startsWith("/parent")) return "/parent/login";
  return "/login";
};

export const getLoginRouteFromRoles = (roles: string[]) => {
  if (roles.length === 1) return getLoginRouteFromRole(roles[0]);
  return "/login";
};
