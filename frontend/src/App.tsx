import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Login from '@/pages/Login';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import ProfilePage from '@/pages/ProfilePage';
import UsersPage from '@/pages/UsersPage';
import QuizzesPage from '@/pages/QuizzesPage';
import ResultsPage from '@/pages/ResultsPage';
import TeachersPage from '@/pages/TeachersPage';
import RolesPage from '@/pages/RolesPage';
import PermissionsPage from '@/pages/PermissionsPage';
import FacultyPage from '@/pages/FacultyPage';
import KafedraPage from '@/pages/KafedraPage';
import GroupsPage from '@/pages/GroupsPage';
import SubjectsPage from '@/pages/SubjectsPage';
import StudentsPage from '@/pages/StudentsPage';
import QuestionsPage from '@/pages/QuestionsPage';
import QuestionFormPage from '@/pages/QuestionFormPage';
import QuizTestPage from '@/pages/QuizTestPage';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  const isStudent = user?.roles?.some(role => role.name.toLowerCase() === 'student');

  if (isStudent) {
    return <Navigate to="/quiz-test" replace />;
  }

  return <Dashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<DashboardRedirect />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/teachers" element={<TeachersPage />} />
                <Route path="/subjects" element={<SubjectsPage />} />

                <Route path="/quiz-test" element={<QuizTestPage />} />
                <Route path="/results" element={<ResultsPage />} />

                <Route path="/roles" element={<RolesPage />} />
                <Route path="/permissions" element={<PermissionsPage />} />
                <Route path="/faculties" element={<FacultyPage />} />
                <Route path="/kafedras" element={<KafedraPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/questions" element={<QuestionsPage />} />
                <Route path="/questions/create" element={<QuestionFormPage />} />
                <Route path="/questions/:id/edit" element={<QuestionFormPage />} />
                <Route path="/quizzes" element={<QuizzesPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
