import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useLeaveSocket } from '../api/useLeaveSocket';
import StatusBadge from './StatusBadge';

export default function MyLeaveList({ refreshKey }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.getMyLeaves();
    setLeaves(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  // When HR approves/rejects, this event fires immediately for the affected
  // employee and we patch the row in place - no polling, no manual refresh.
  const handleUpdate = useCallback((updated) => {
    setLeaves((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }, []);
  useLeaveSocket(handleUpdate);

  if (loading) return <p>Loading your leave requests...</p>;
  if (leaves.length === 0) return <p>No leave requests yet.</p>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th align="left">Type</th>
          <th align="left">Dates</th>
          <th align="left">Remarks</th>
          <th align="left">Status</th>
          <th align="left">HR comment</th>
        </tr>
      </thead>
      <tbody>
        {leaves.map((l) => (
          <tr key={l.id} style={{ borderTop: '1px solid #eee' }}>
            <td>{l.leave_type}</td>
            <td>{l.start_date} → {l.end_date}</td>
            <td>{l.remarks || '—'}</td>
            <td><StatusBadge status={l.status} /></td>
            <td>{l.hr_comment || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
