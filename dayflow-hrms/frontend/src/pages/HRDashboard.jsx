import { useAuth } from '../api/AuthContext';
import AllLeaveRequests from '../components/AllLeaveRequests';
import PayrollAdmin from '../components/PayrollAdmin';

export default function HRDashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', fontFamily: 'sans-serif', display: 'grid', gap: 32 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>HR Dashboard — {user.name}</h1>
        <button onClick={logout}>Log out</button>
      </header>

      <AllLeaveRequests />
      <PayrollAdmin />
    </div>
  );
}
