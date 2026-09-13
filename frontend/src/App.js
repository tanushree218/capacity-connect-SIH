import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard";
import CourseCatalog from "@/pages/employee/CourseCatalog";
import CourseDetail from "@/pages/employee/CourseDetail";
import CompetencyProfile from "@/pages/employee/CompetencyProfile";
import Certificates from "@/pages/employee/Certificates";
import CertificateView from "@/pages/employee/CertificateView";
import VerifyCertificate from "@/pages/VerifyCertificate";
import AdminOverview from "@/pages/admin/AdminOverview";
import GapDashboard from "@/pages/admin/GapDashboard";
import Employees from "@/pages/admin/Employees";
import EmployeeProfile from "@/pages/admin/EmployeeProfile";
import AdminCourses from "@/pages/admin/AdminCourses";
import TrainerDashboard from "@/pages/trainer/TrainerDashboard";
import CreateCourse from "@/pages/trainer/CreateCourse";

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function RoleHome() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-slate-500">Loading...</div>;
  if (!user) return <Landing />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "trainer") return <Navigate to="/trainer" replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/" element={<RoleHome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify/:id" element={<VerifyCertificate />} />

            {/* Employee */}
            <Route path="/dashboard" element={<Protected roles={["employee"]}><EmployeeDashboard /></Protected>} />
            <Route path="/catalog" element={<Protected><CourseCatalog /></Protected>} />
            <Route path="/course/:id" element={<Protected><CourseDetail /></Protected>} />
            <Route path="/competency" element={<Protected roles={["employee"]}><CompetencyProfile /></Protected>} />
            <Route path="/certificates" element={<Protected roles={["employee"]}><Certificates /></Protected>} />
            <Route path="/certificate/:id" element={<Protected><CertificateView /></Protected>} />

            {/* Admin */}
            <Route path="/admin" element={<Protected roles={["admin"]}><AdminOverview /></Protected>} />
            <Route path="/admin/gap-dashboard" element={<Protected roles={["admin"]}><GapDashboard /></Protected>} />
            <Route path="/admin/employees" element={<Protected roles={["admin"]}><Employees /></Protected>} />
            <Route path="/admin/employee/:id" element={<Protected roles={["admin"]}><EmployeeProfile /></Protected>} />
            <Route path="/admin/courses" element={<Protected roles={["admin"]}><AdminCourses /></Protected>} />

            {/* Trainer */}
            <Route path="/trainer" element={<Protected roles={["trainer", "admin"]}><TrainerDashboard /></Protected>} />
            <Route path="/trainer/courses" element={<Protected roles={["trainer", "admin"]}><AdminCourses /></Protected>} />
            <Route path="/trainer/create" element={<Protected roles={["trainer", "admin"]}><CreateCourse /></Protected>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
