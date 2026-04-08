import type { UserRole } from "@/shared/lib/types";

export const homeByRole: Record<UserRole, string> = {
  parent: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  chw: "/doctor/dashboard",
  admin: "/doctor/dashboard",
};

export const isClinicalRole = (role: UserRole) => role === "doctor" || role === "chw" || role === "admin";
