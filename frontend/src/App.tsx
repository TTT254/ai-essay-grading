/**
 * 主应用组件
 * 配置路由和全局状态
 */
import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp, FloatButton } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuthStore } from './store/authStore';
import Loading from './components/Loading';
import './App.css';

// Lazy loading pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

const StudentLayout = lazy(() => import('./pages/student/StudentLayout'));
const StudentSelectClass = lazy(() => import('./pages/student/SelectClass'));
const StudentTasks = lazy(() => import('./pages/student/Tasks'));
const StudentSubmit = lazy(() => import('./pages/student/Submit'));
const StudentHistory = lazy(() => import('./pages/student/History'));
const StudentReport = lazy(() => import('./pages/student/Report'));
const StudentAIChat = lazy(() => import('./pages/student/AIChat'));
const StudentMistakes = lazy(() => import('./pages/student/Mistakes'));
const StudentProfile = lazy(() => import('./pages/student/Profile'));

const TeacherLayout = lazy(() => import('./pages/teacher/TeacherLayout'));
const TeacherClasses = lazy(() => import('./pages/teacher/Classes'));
const TeacherAssignments = lazy(() => import('./pages/teacher/Assignments'));
const TeacherGrading = lazy(() => import('./pages/teacher/Grading'));
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'));
const TeacherProfile = lazy(() => import('./pages/teacher/Profile'));

// 路由守卫组件
interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'student' | 'teacher';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { checkAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#0066FF',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          colorBgContainer: '#ffffff',
        },
        components: {
          Button: {
            controlHeight: 40,
            borderRadius: 8,
            boxShadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
          },
          Card: {
            borderRadiusLG: 16,
            boxShadowTertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
          },
          Input: {
            controlHeight: 40,
            borderRadius: 8,
          }
        }
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* 公开路由 */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* 首页重定向 */}
              <Route
                path="/dashboard"
                element={
                  isAuthenticated ? (
                    user?.role === 'student' ? (
                      <Navigate to="/student/tasks" replace />
                    ) : (
                      <Navigate to="/teacher/classes" replace />
                    )
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              {/* 学生端路由 */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute role="student">
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="select-class" element={<StudentSelectClass />} />
                <Route path="tasks" element={<StudentTasks />} />
                <Route path="submit/:assignmentId" element={<StudentSubmit />} />
                <Route path="history" element={<StudentHistory />} />
                <Route path="report/:submissionId" element={<StudentReport />} />
                <Route path="ai-chat/:submissionId" element={<StudentAIChat />} />
                <Route path="mistakes" element={<StudentMistakes />} />
                <Route path="profile" element={<StudentProfile />} />
                <Route index element={<Navigate to="tasks" replace />} />
              </Route>

              {/* 教师端路由 */}
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute role="teacher">
                    <TeacherLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="classes" element={<TeacherClasses />} />
                <Route path="assignments" element={<TeacherAssignments />} />
                <Route path="grading/:assignmentId" element={<TeacherGrading />} />
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="profile" element={<TeacherProfile />} />
                <Route index element={<Navigate to="classes" replace />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <FloatButton.BackTop
            visibilityHeight={300}
            style={{ bottom: 80, right: 24 }}
          />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
