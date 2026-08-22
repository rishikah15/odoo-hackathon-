import { AuthProvider, useAuth } from './api/AuthContext';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HRDashboard from './pages/HRDashboard';

function Shell() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Login />;
  return user.role === 'hr' ? <HRDashboard /> : <EmployeeDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
