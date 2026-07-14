/** @format */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AdminLayout from "./components/Layout/AdminLayout";
import TeacherLayout from "./components/Layout/TeacherLayout";
import StudentLayout from "./components/Layout/StudentLayout";
import ParentLayout from "./components/Layout/ParentLayout";
import AdminLoginPage from "./pages/admin/LoginPage";
import TeacherLoginPage from "./pages/teacher/LoginPage";
import StudentLoginPage from "./pages/student/LoginPage";
import ParentLoginPage from "./pages/parent/LoginPage";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/admin/Dashboard";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageTeachers from "./pages/admin/ManageTeachers";
import ManageClasses from "./pages/admin/ManageClasses";
import Reports from "./pages/admin/AttendanceReport";
import ManageFace from "./pages/admin/ManageFace";
import ManageParents from "./pages/admin/ManageParents";
import TeacherDashboard from "./pages/teacher/Dashboard";
import ClassAttendance from "./pages/teacher/ClassAttendance";
import SelfAttendanceTeacher from "./pages/teacher/SelfAttendance";
import TeachingSchedule from "./pages/teacher/TeachingSchedule";
import Evaluation from "./pages/teacher/Evaluation";
import AnnouncementTeacher from "./pages/teacher/Announcement";
import RegisterFaceTeacher from "./pages/teacher/RegisterFace";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import StudentDashboard from "./pages/student/Dashboard";
import AdminTeachingSchedule from "./pages/admin/TeachingSchedule";
import Setting from "./pages/admin/Setting";
import ProtectedRoute from "./components/ProtectedRoute";
import AttendanceHistory from "./pages/teacher/AttendanceHistory";
import NotificationTeacher from "./pages/teacher/Notification";
import AnnouncementStudent from "./pages/student/Announcement";
import Schedule from "./pages/student/Schedule";
import SelfAttendanceStudent from "./pages/student/SelfAttendance";
import RegisterFaceStudent from "./pages/student/RegisterFace";
import PermissionStudent from "./pages/student/PermissionStudent";
import StudentProfile from "./pages/student/StudentProfile";
import StudentPermit from "./pages/teacher/StudentPermit";
import TeacherPermit from "./pages/teacher/TeacherPermit";
import PermissionAdmin from "./pages/admin/PermissionAdmin";
import AttendanceHistoryStudent from "./pages/student/AttendanceHistory";
import ParentDashboard from "./pages/parent/Dashboard";
import ChildData from "./pages/parent/ChildData";
import ParentAttendance from "./pages/parent/Attendance";
import ParentSchedule from "./pages/parent/Schedule";
import ParentAnnouncements from "./pages/parent/Announcements";
import ParentReports from "./pages/parent/Reports";
import ParentMessages from "./pages/parent/Messages";
import ParentSettings from "./pages/parent/Settings";
import ParentProfile from "./pages/parent/Profile";
import NotificationParent from "./pages/parent/Notification";

const getRedirectPath = () => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");

    if (user?.role === "admin") return "/admin";
    if (user?.role === "guru") return "/teacher/dashboard";
    if (user?.role === "siswa") return "/student/dashboard";
    if (user?.role === "ortu" || user?.role === "orangtua") return "/parent";
  } catch {
    console.warn("Invalid user data in session storage");
  }

  return null;
};

const RootRedirect = () => {
  const redirectPath = getRedirectPath();

  return redirectPath ? <Navigate to={redirectPath} replace /> : <HomePage />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Login Pages */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/teacher/login" element={<TeacherLoginPage />} />
        <Route path="/student/login" element={<StudentLoginPage />} />
        <Route path="/parent/login" element={<ParentLoginPage />} />
        <Route path="/login" element={<AdminLoginPage />} />

        {/* ✅ ADMIN LAYOUT - khusus admin */}
        <Route element={<AdminLayout />}>
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/manage-students" element={<ManageStudents />} />
            <Route path="/admin/manage-teachers" element={<ManageTeachers />} />
            <Route path="/admin/manage-classes" element={<ManageClasses />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/biometrics" element={<ManageFace />} />
            <Route path="/admin/manage-parents" element={<ManageParents />} />
            <Route path="/admin/settings" element={<Setting />} />
            <Route path="/admin/permissions" element={<PermissionAdmin />} />
            <Route path="/admin/schedule" element={<AdminTeachingSchedule />} />
          </Route>
        </Route>

        {/* ✅ TEACHER LAYOUT - khusus guru */}
        <Route element={<TeacherLayout />}>
          <Route element={<ProtectedRoute allowedRoles={["guru"]} />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/profile" element={<TeacherProfile />} />
            <Route path="/teacher/attendance" element={<ClassAttendance />} />
            <Route
              path="/teacher/self-attendance"
              element={<SelfAttendanceTeacher />}
            />
            <Route
              path="/teacher/register-face"
              element={<RegisterFaceTeacher />}
            />
            <Route path="/teacher/schedule" element={<TeachingSchedule />} />
            <Route path="/teacher/evaluation" element={<Evaluation />} />
            <Route
              path="/teacher/announcement"
              element={<AnnouncementTeacher />}
            />
            <Route
              path="/teacher/notifications"
              element={<NotificationTeacher />}
            />
            <Route path="/teacher/history" element={<AttendanceHistory />} />
            <Route path="/teacher/teacher-permit" element={<TeacherPermit />} />
            <Route path="/teacher/student-permit" element={<StudentPermit />} />
            <Route
              path="/teacher/permission"
              element={<Navigate to="/teacher/teacher-permit" replace />}
            />
          </Route>
        </Route>

        {/* ✅ STUDENT LAYOUT - khusus siswa */}
        <Route element={<StudentLayout />}>
          <Route element={<ProtectedRoute allowedRoles={["siswa"]} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route
              path="/student/announcements"
              element={<AnnouncementStudent />}
            />
            <Route path="/student/schedule" element={<Schedule />} />
            <Route
              path="/student/self-attendance"
              element={<SelfAttendanceStudent />}
            />
            <Route
              path="/student/register-face"
              element={<RegisterFaceStudent />}
            />
            <Route path="/student/permission" element={<PermissionStudent />} />
            <Route
              path="/student/attendance-history"
              element={<AttendanceHistoryStudent />}
            />
          </Route>
        </Route>

        {/* ✅ PARENT LAYOUT - khusus orang tua */}
        <Route element={<ParentLayout />}>
          <Route
            element={<ProtectedRoute allowedRoles={["ortu", "orangtua"]} />}
          >
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/child-data" element={<ChildData />} />
            <Route path="/parent/attendance" element={<ParentAttendance />} />
            <Route path="/parent/schedule" element={<ParentSchedule />} />
            <Route
              path="/parent/announcements"
              element={<ParentAnnouncements />}
            />
            <Route path="/parent/reports" element={<ParentReports />} />
            <Route path="/parent/messages" element={<ParentMessages />} />
            <Route path="/parent/settings" element={<ParentSettings />} />
            <Route path="/parent/profile" element={<ParentProfile />} />
            <Route
              path="/parent/notifications"
              element={<NotificationParent />}
            />
          </Route>
        </Route>

        <Route path="/" element={<RootRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
