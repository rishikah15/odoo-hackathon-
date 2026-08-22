import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function MyPayroll() {
  const [payroll, setPayroll] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMyPayroll().then(setPayroll).catch((e) => setError(e.message));
  }, []);

  if (error) return <p role="alert" style={{ color: 'crimson' }}>{error}</p>;
  if (!payroll) return <p>Loading payroll...</p>;

  const gross = Number(payroll.basic_salary) + Number(payroll.hra) + Number(payroll.allowances);
  const net = gross - Number(payroll.deductions);

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <h3>My payroll <span style={{ fontSize: 12, fontWeight: 400 }}>(read-only)</span></h3>
      <table>
        <tbody>
          <tr><td>Basic salary</td><td align="right">{payroll.basic_salary}</td></tr>
          <tr><td>HRA</td><td align="right">{payroll.hra}</td></tr>
          <tr><td>Allowances</td><td align="right">{payroll.allowances}</td></tr>
          <tr><td>Deductions</td><td align="right">-{payroll.deductions}</td></tr>
          <tr style={{ fontWeight: 700, borderTop: '1px solid #ccc' }}>
            <td>Net pay</td><td align="right">{net}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
