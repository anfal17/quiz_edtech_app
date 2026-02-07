import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Layout, MinimalLayout } from './components/layout';
import CoursePlayerLayout from './components/layout/CoursePlayerLayout';
import AdminLayout from './components/layout/AdminLayout';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute, { AdminRoute, GuestRoute } from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Explore from './pages/Explore';
import DomainDetail from './pages/DomainDetail';
import Reading from './pages/Reading';
import Quiz from './pages/Quiz';
import Dashboard from './pages/Dashboard';
import CreateQuiz from './pages/CreateQuiz';
import About from './pages/About';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Support from './pages/Support';
import TicketDetail from './pages/TicketDetail';
import NotFound from './pages/NotFound';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageCourses from './pages/admin/ManageCourses';
import ManageChapters from './pages/admin/ManageChapters';
import ManageQuizzes from './pages/admin/ManageQuizzes';
import ManageUsers from './pages/admin/ManageUsers';
import ManageTickets from './pages/admin/ManageTickets';
import CourseEditor from './components/admin/CourseEditor';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            {/* Main Layout with Footer */}
            <Route element={<Layout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-quiz" element={<CreateQuiz />} />
              <Route path="/about" element={<About />} />
              <Route path="/profile" element={
                <ProtectedRoute><Profile /></ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute><Settings /></ProtectedRoute>
              } />
              <Route path="/support" element={
                <ProtectedRoute><Support /></ProtectedRoute>
              } />
              <Route path="/support/:id" element={
                <ProtectedRoute><TicketDetail /></ProtectedRoute>
              } />
            </Route>

            {/* Course Content Player Layout */}
            <Route element={<CoursePlayerLayout />}>
              <Route path="/domain/:domainId/chapter/:chapterId/read" element={<Reading />} />
              <Route path="/domain/:domainId/quiz/:quizId" element={<Quiz />} />
            </Route>

            {/* Standalone Quiz (outside of course context) - keep Minimal or move to Player? */}
            {/* If it's a standalone quiz, CoursePlayer might fail to load domain. Keep Minimal for now. */}
            <Route element={<MinimalLayout />}>
              <Route path="/domain/:domainId" element={<DomainDetail />} />
              <Route path="/domain/:domainId/chapter/:chapterId/quiz" element={<Quiz />} /> {/* Legacy route? */}
              <Route path="/quiz/:quizId" element={<Quiz />} />
            </Route>

            {/* Auth Pages (guest only) */}
            <Route path="/login" element={
              <GuestRoute><Login /></GuestRoute>
            } />
            <Route path="/signup" element={
              <GuestRoute><Signup /></GuestRoute>
            } />

            {/* Admin Pages (admin only) */}
            <Route path="/admin" element={
              <AdminRoute><AdminLayout /></AdminRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="courses" element={<ManageCourses />} />
              <Route path="course-editor/:courseId" element={<CourseEditor />} />
              <Route path="chapters" element={<ManageChapters />} />
              <Route path="quizzes" element={<ManageQuizzes />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="tickets" element={<ManageTickets />} />
            </Route>

            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
