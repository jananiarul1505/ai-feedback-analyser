import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Login } from './pages/Login';
import { Feedback } from './pages/Feedback';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import { Settings } from './pages/Settings';
import { AccessDenied } from './pages/AccessDenied';
import { NotFound } from './pages/NotFound';
import { Layout } from './components/Layout';
import { auth, onAuthStateChanged } from './services/firebase';
import { dataService } from './services/data';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

// Protected Route Component
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (dataService.isUserBanned(user.email)) {
    return <Navigate to="/access-denied" replace />;
  }

  if (requireAdmin) {
    // Check if user is admin via dataService (mock logic)
    const appUser = dataService.getUser(user.email);
    if (!appUser?.isAdmin) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/feedback" element={
            <ProtectedRoute>
              <Layout>
                <Feedback />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute>
              <Layout>
                <Admin />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;