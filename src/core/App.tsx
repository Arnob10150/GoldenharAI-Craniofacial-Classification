import { Navigate, Route, Routes } from "react-router-dom";
import { PortalLayout } from "@/core/layout/PortalLayout";
import Landing from "@/features/marketing/pages/Landing";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import PatientDashboard from "@/features/patient/pages/Dashboard";
import PatientNewScan from "@/features/patient/pages/NewScan";
import PatientScanResult from "@/features/patient/pages/ScanResult";
import ScanHistory from "@/features/patient/pages/ScanHistory";
import ChildProfile from "@/features/patient/pages/ChildProfile";
import DoctorDashboard from "@/features/doctor/pages/Dashboard";
import DoctorNewScan from "@/features/doctor/pages/NewScan";
import PatientList from "@/features/doctor/pages/PatientList";
import ScanDetail from "@/features/doctor/pages/ScanDetail";
import Referrals from "@/features/doctor/pages/Referrals";
import Analytics from "@/features/doctor/pages/Analytics";
import { ProtectedRoute } from "@/core/router/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<ProtectedRoute requireGuest />}>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute roles={["parent"]} />}>
        <Route element={<PortalLayout />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/new-scan" element={<PatientNewScan />} />
          <Route path="/patient/results/:scanId" element={<PatientScanResult />} />
          <Route path="/patient/history" element={<ScanHistory />} />
          <Route path="/patient/children" element={<ChildProfile />} />
          <Route path="/patient/resources" element={<Navigate to="/patient/dashboard" replace />} />
          <Route path="/patient/community" element={<Navigate to="/patient/dashboard" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["doctor", "chw", "admin"]} />}>
        <Route element={<PortalLayout />}>
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/new-scan" element={<DoctorNewScan />} />
          <Route path="/doctor/patients" element={<PatientList />} />
          <Route path="/doctor/scans/:scanId" element={<ScanDetail />} />
          <Route path="/doctor/referrals" element={<Referrals />} />
          <Route path="/doctor/analytics" element={<Analytics />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

