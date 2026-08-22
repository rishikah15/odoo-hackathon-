import { useEffect, useState } from 'react';
import { api } from '../api/client';
import StatusBadge from './StatusBadge';

export default function AllLeaveRequests() {
  const [leaves, setLeaves] = useState([]);
  const [comments, setComments] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    const data = await api.getAllLeaves();
    setLeaves(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id, decision) {
    setError('');
    setBusyId(id);
    try {
      // Optimistic-then-authoritative: server response drives the final state,
      // and the same update is pushed to the employee via socket.io.
      const updated = await api.decideLeave(id, decision, comments[id] || '');
      setLeaves((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h3>All leave requests</h3>
      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Employee</th>
            <th align="left">Type</th>
            <th align="left">Dates</th>
            <th align="left">Remarks</th>
            <th align="left">Status</th>
            <th align="left">Comment</th>
            <th align="left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((l) => (
            <tr key={l.id} style={{ borderTop: '1px solid #eee' }}>
              <td>{l.employee_name}</td>
              <td>{l.leave_type}</td>
              <td>{l.start_date} → {l.end_date}</td>
              <td>{l.remarks || '—'}</td>
              <td><StatusBadge status={l.status} /></td>
              <td>
                {l.status === 'pending' ? (
                  <input
                    placeholder="Optional comment"
                    value={comments[l.id] || ''}
                    onChange={(e) => setComments((c) => ({ ...c, [l.id]: e.target.value }))}
                  />
                ) : (
                  l.hr_comment || '—'
                )}
              </td>
              <td>
                {l.status === 'pending' ? (
                  <>
                    <button disabled={busyId === l.id} onClick={() => decide(l.id, 'approved')}>Approve</button>{' '}
                    <button disabled={busyId === l.id} onClick={() => decide(l.id, 'rejected')}>Reject</button>
                  </>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
