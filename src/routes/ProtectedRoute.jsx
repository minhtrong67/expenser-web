import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Gate for the signed-in app. `landing` is what signed-out visitors see at the
 * root URL (the intro page) instead of being bounced to the login screen.
 */
export default function ProtectedRoute({ children, landing }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // no splash: the themed page background shows until auth resolves
  if (!user && landing && location.pathname === '/') return landing;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}
