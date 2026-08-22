import { useState } from 'react';
import { useAuth } from '../api/AuthContext';
import LeaveForm from '../components/LeaveForm';
import MyLeaveList from '../components/MyLeaveList';
import MyPayroll from '../components/MyPayroll';
import AttendanceWidget from '../components/AttendanceWidget';
import ProfileEditor from '../components/ProfileEditor';

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif', display: 'grid', gap: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Welcome, {user.name}</h1>
        <button onClick={logout}>Log out</button>
      </header>

      <AttendanceWidget />

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        <LeaveForm onSubmitted={() => setRefreshKey((k) => k + 1)} />
        <div>
          <h3>My leave requests</h3>
          <MyLeaveList refreshKey={refreshKey} />
        </div>
      </section>

      <MyPayroll />
      <ProfileEditor />
    </div>
  );
}
