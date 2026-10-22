import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // no splash: the themed page background shows until auth resolves
  if (user) return <Navigate to="/" replace />;
  return children;
}
