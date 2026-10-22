import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SplashScreen from '../components/ui/SplashScreen';

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />; // same splash as index.html, so there is no blank gap while auth restores
  if (user) return <Navigate to="/" replace />;
  return children;
}
