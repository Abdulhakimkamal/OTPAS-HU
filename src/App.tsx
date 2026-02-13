import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute, RoleBasedRedirect } from "@/components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Dashboard pages
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAddFaculty from "./pages/admin/AdminAddFaculty";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminReports from "./pages/admin/AdminReports";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminChangePassword from "./pages/admin/AdminChangePassword";
import AdminStudentProgress from "./pages/admin/AdminStudentProgress";
import AdminRecommendations from "./pages/admin/AdminRecommendations";
import CreateUserForm from "./pages/admin/CreateUserForm";

import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import InstructorChangePassword from "./pages/instructor/InstructorChangePassword";
import InstructorProfile from "./pages/instructor/InstructorProfile";
import InstructorMyCourses from "./pages/instructor/MyCourses";
import InstructorAnnouncements from "./pages/instructor/Announcements";
import InstructorStudents from "./pages/instructor/Students";
import InstructorEvaluations from "./pages/instructor/Evaluations";
import InstructorMessages from "./pages/instructor/Messages";
import InstructorReports from "./pages/instructor/Reports";
import InstructorSettings from "./pages/instructor/InstructorSettings";
import InstructorRecommendations from "./pages/instructor/Recommendations";
import InstructorAcademicProjects from "./pages/instructor/AcademicProjects";
import InstructorTutorialManagement from "./pages/instructor/TutorialManagement";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAnnouncements from "./pages/student/StudentAnnouncements";
import StudentProjects from "./pages/student/StudentProjects";
import StudentAcademicProjects from "./pages/student/AcademicProjects";
import StudentTutorials from "./pages/student/StudentTutorials";
import TutorialViewer from "./pages/student/TutorialViewer";
import StudentProgress from "./pages/student/StudentProgress";
import StudentRecommendations from "./pages/student/StudentRecommendations";
import StudentMessages from "./pages/student/StudentMessages";
import StudentCourses from "./pages/student/StudentCourses";
import StudentSettings from "./pages/student/StudentSettings";
import StudentChangePassword from "./pages/student/StudentChangePassword";

// Department Head pages
import { DepartmentHeadLayout } from "./components/departmentHead/DepartmentHeadLayout";
import DepartmentHeadDashboard from "./pages/departmentHead/DepartmentHeadDashboard";
import ManageStudents from "./pages/departmentHead/ManageStudentsPage";
import ManageCourses from "./pages/departmentHead/ManageCourses";
import ManageInstructors from "./pages/departmentHead/ManageInstructors";
import ManageInstructorsAdvisors from "./pages/departmentHead/ManageInstructorsAdvisors";
import Reports from "./pages/departmentHead/Reports";
import Recommendations from "./pages/departmentHead/Recommendations";
import DeptHeadProfile from "./pages/departmentHead/Profile";
import DeptHeadChangePassword from "./pages/departmentHead/ChangePassword";
import DeptHeadMessages from "./pages/departmentHead/Messages";
import EvaluationAnalytics from "./pages/departmentHead/EvaluationAnalytics";
import AcademicMonitoring from "./pages/departmentHead/AcademicMonitoring";
import CourseMaterials from "./pages/departmentHead/CourseMaterials";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Role-based redirect */}
            <Route path="/dashboard" element={<RoleBasedRedirect />} />

            {/* Admin routes (also accessible by super_admin) */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminOverview />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/add-faculty" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminAddFaculty />
              </ProtectedRoute>
            } />
            <Route path="/admin/create-user" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <CreateUserForm />
              </ProtectedRoute>
            } />
            <Route path="/admin/departments" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDepartments />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminReports />
              </ProtectedRoute>
            } />
            <Route path="/admin/logs" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminLogs />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/profile" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminProfile />
              </ProtectedRoute>
            } />
            <Route path="/admin/change-password" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminChangePassword />
              </ProtectedRoute>
            } />
            <Route path="/admin/student-progress" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminStudentProgress />
              </ProtectedRoute>
            } />
            <Route path="/admin/recommendations" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminRecommendations />
              </ProtectedRoute>
            } />
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminOverview />
              </ProtectedRoute>
            } />

            {/* Department Head routes */}
            <Route path="/department-head" element={
              <ProtectedRoute allowedRoles={['department_head']}>
                <DepartmentHeadLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DepartmentHeadDashboard />} />
              <Route path="students" element={<ManageStudents />} />
              <Route path="courses" element={<ManageCourses />} />
              <Route path="instructors" element={<ManageInstructors />} />
              <Route path="project-advisors" element={<ManageInstructorsAdvisors />} />
              <Route path="evaluation-analytics" element={<EvaluationAnalytics />} />
              <Route path="academic-monitoring" element={<AcademicMonitoring />} />
              <Route path="course-materials" element={<CourseMaterials />} />
              <Route path="reports" element={<Reports />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="messages" element={<DeptHeadMessages />} />
              <Route path="profile" element={<DeptHeadProfile />} />
              <Route path="change-password" element={<DeptHeadChangePassword />} />
            </Route>

            {/* Legacy Department routes - redirect to department-head */}
            <Route path="/department" element={<Navigate to="/department-head" replace />} />
            <Route path="/department/*" element={<Navigate to="/department-head" replace />} />

            {/* Instructor routes */}
            <Route path="/instructor" element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/instructor/courses" element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorMyCourses />
              </ProtectedRoute>
            } />
            <Route path="/instructor/announcements" element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorAnnouncements />
              </ProtectedRoute>
            } />
            <Route path="/instructor/students" element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorStudents />
              </ProtectedRoute>
            } />
            <Route path="/instructor/evaluations" element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorEvaluations />
              </ProtectedRoute>
            } />
            <Route path="/instructor/messages" element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorMessages />
              </ProtectedRoute>
            } />
            <Route path="/instructor/reports" element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorReports />
              </ProtectedRoute>
            } />
            <Route path="/instructor/recommendations" element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorRecommendations />
              </ProtectedRoute>
            } />
            <Route path="/instructor/academic-projects" element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorAcademicProjects />
              </ProtectedRoute>
            } />
            <Route path="/instructor/tutorial-management" element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorTutorialManagement />
              </ProtectedRoute>
            } />
            <Route path="/instructor/change-password" element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorChangePassword />
              </ProtectedRoute>
            } />
            <Route path="/instructor/profile" element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorProfile />
              </ProtectedRoute>
            } />
            <Route path="/instructor/settings" element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorSettings />
              </ProtectedRoute>
            } />
            <Route path="/instructor/*" element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorDashboard />
              </ProtectedRoute>
            } />

            {/* Student routes */}
            <Route path="/student" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/announcements" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentAnnouncements />
              </ProtectedRoute>
            } />
            <Route path="/student/projects" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentProjects />
              </ProtectedRoute>
            } />
            <Route path="/student/tutorials" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentTutorials />
              </ProtectedRoute>
            } />
            <Route path="/student/tutorials/:id" element={
              <ProtectedRoute allowedRoles={['student']}>
                <TutorialViewer />
              </ProtectedRoute>
            } />
            <Route path="/student/progress" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentProgress />
              </ProtectedRoute>
            } />
            <Route path="/student/recommendations" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentRecommendations />
              </ProtectedRoute>
            } />
            <Route path="/student/messages" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentMessages />
              </ProtectedRoute>
            } />
            <Route path="/student/courses" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentCourses />
              </ProtectedRoute>
            } />
            <Route path="/student/settings" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentSettings />
              </ProtectedRoute>
            } />
            <Route path="/student/change-password" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentChangePassword />
              </ProtectedRoute>
            } />
            <Route path="/student/academic-projects" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentAcademicProjects />
              </ProtectedRoute>
            } />
            <Route path="/student/*" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />

            {/* Settings route */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <InstructorSettings />
              </ProtectedRoute>
            } />

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;