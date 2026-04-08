import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingPanel } from "@/shared/components/LoadingPanel";
import { homeByRole } from "@/shared/lib/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { UserRole } from "@/shared/lib/types";

interface ProtectedRouteProps {
  roles?: UserRole[];
  requireGuest?: boolean;
}

export const ProtectedRoute = ({ roles, requireGuest = false }: ProtectedRouteProps) => {
  const { initialized, loading, profile } = useAuthStore();
  const location = useLocation();

  if (!initialized || loading) {
    return <LoadingPanel title="Preparing your GoldenScope AI workspace" description="Syncing profile, notifications, and care data." />;
  }

  if (requireGuest) {
    if (profile) {
      return <Navigate to={homeByRole[profile.role]} replace />;
    }
    return <Outlet />;
  }

  if (!profile) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to={homeByRole[profile.role]} replace />;
  }

  return <Outlet />;
};
