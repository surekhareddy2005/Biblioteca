import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import BooksPage from './pages/BooksPage';
import IssuesPage from './pages/IssuesPage';
import StudentsPage from './pages/StudentsPage';
import ReservationsPage from './pages/ReservationsPage';
import HolidaysPage from './pages/HolidaysPage';

// Layout wrapper for authenticated pages
const MainLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-main)', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Root Redirector based on user role
const RootRedirect = () => {
  const { isAuthenticated, role } = React.useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'STUDENT') {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <Navigate to="/admin/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Root Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
              <Route element={<MainLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/books" element={<BooksPage />} />
                <Route path="/admin/issues" element={<IssuesPage />} />
                <Route path="/admin/students" element={<StudentsPage />} />
                <Route path="/admin/reservations" element={<ReservationsPage />} />
                <Route path="/admin/holidays" element={<HolidaysPage />} />
              </Route>
            </Route>

            {/* Protected Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
              <Route element={<MainLayout />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/books" element={<BooksPage />} />
                <Route path="/student/reservations" element={<ReservationsPage />} />
              </Route>
            </Route>

            {/* Catch-all 404 Fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
