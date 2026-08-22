import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function PayrollAdmin() {
  const [rows, setRows] = useState([]);
  const [edits, setEdits] = useState({});
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  async function load() {
    const data = await api.getAllPayroll();
    setRows(data);
  }

  useEffect(() => {
    load();
  }, []);

  function fieldValue(row, field) {
    return edits[row.employee_id]?.[field] ?? row[field];
  }

  function setField(employeeId, field, value) {
    setEdits((prev) => ({
      ...prev,
      [employeeId]: { ...prev[employeeId], [field]: value },
    }));
  }

  async function save(row) {
    setError('');
    setSavingId(row.employee_id);
    try {
      const patch = edits[row.employee_id] || {};
      const payload = {
        basic_salary: patch.basic_salary !== undefined ? Number(patch.basic_salary) : undefined,
        hra: patch.hra !== undefined ? Number(patch.hra) : undefined,
        allowances: patch.allowances !== undefined ? Number(patch.allowances) : undefined,
        deductions: patch.deductions !== undefined ? Number(patch.deductions) : undefined,
      };
      const updated = await api.updatePayroll(row.employee_id, payload);
      setRows((prev) => prev.map((r) => (r.employee_id === row.employee_id ? { ...r, ...updated } : r)));
      setEdits((prev) => ({ ...prev, [row.employee_id]: {} }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  const fields = ['basic_salary', 'hra', 'allowances', 'deductions'];

  return (
    <div>
      <h3>Payroll administration</h3>
      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Employee</th>
            {fields.map((f) => <th key={f} align="left">{f.replace('_', ' ')}</th>)}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.employee_id} style={{ borderTop: '1px solid #eee' }}>
              <td>{row.employee_name}</td>
              {fields.map((f) => (
                <td key={f}>
                  <input
                    type="number"
                    value={fieldValue(row, f)}
                    onChange={(e) => setField(row.employee_id, f, e.target.value)}
                    style={{ width: 90 }}
                  />
                </td>
              ))}
              <td>
                <button disabled={savingId === row.employee_id} onClick={() => save(row)}>
                  {savingId === row.employee_id ? 'Saving...' : 'Save'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
