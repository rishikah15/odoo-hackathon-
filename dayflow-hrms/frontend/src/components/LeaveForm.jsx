import { useState } from 'react';
import { api } from '../api/client';

export default function LeaveForm({ onSubmitted }) {
  const [leaveType, setLeaveType] = useState('paid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const created = await api.submitLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        remarks,
      });
      setStartDate('');
      setEndDate('');
      setRemarks('');
      onSubmitted?.(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
      <h3>Apply for leave</h3>
      <label>
        Leave type
        <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} style={{ display: 'block', marginBottom: 8 }}>
          <option value="paid">Paid Leave</option>
          <option value="sick">Sick Leave</option>
          <option value="unpaid">Unpaid Leave</option>
        </select>
      </label>
      <label>
        Start date
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={{ display: 'block', marginBottom: 8 }} />
      </label>
      <label>
        End date
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required style={{ display: 'block', marginBottom: 8 }} />
      </label>
      <label>
        Remarks
        <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} style={{ display: 'block', width: '100%', marginBottom: 8 }} />
      </label>
      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Submitting...' : 'Submit request'}</button>
    </form>
  );
}
