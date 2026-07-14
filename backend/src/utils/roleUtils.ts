/** @format */

export const normalizeUserRole = (role?: string | null): string => {
  const normalized = typeof role === "string" ? role.trim().toLowerCase() : "";

  switch (normalized) {
    case "orangtua":
    case "orang tua":
    case "ortu":
    case "parent":
    case "parents":
      return "orangtua";
    case "admin":
    case "administrator":
      return "admin";
    case "guru":
    case "teacher":
    case "pengajar":
      return "guru";
    case "siswa":
    case "student":
    case "murid":
      return "siswa";
    default:
      return normalized;
  }
};
