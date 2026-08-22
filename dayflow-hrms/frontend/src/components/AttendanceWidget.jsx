import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function AttendanceWidget() {
  const [today, setToday] = useState(null);
  const [error, setError] = useState('');

  async function refresh() {
    const data = await api.getTodayAttendance();
    setToday(data);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCheckIn() {
    setError('');
    try {
      await api.checkIn();
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCheckOut() {
    setError('');
    try {
      await api.checkOut();
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <h3>Attendance</h3>
      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
      <p>Check-in: {today?.check_in ? new Date(today.check_in).toLocaleTimeString() : '—'}</p>
      <p>Check-out: {today?.check_out ? new Date(today.check_out).toLocaleTimeString() : '—'}</p>
      <button onClick={handleCheckIn} disabled={!!today?.check_in}>Check in</button>{' '}
      <button onClick={handleCheckOut} disabled={!today?.check_in || !!today?.check_out}>Check out</button>
    </div>
  );
}
