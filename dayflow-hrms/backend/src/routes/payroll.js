const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/payroll/mine - employee (or HR) views their own payroll, read-only
router.get('/mine', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM payroll WHERE employee_id = $1',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No payroll record found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('Fetch own payroll error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/payroll - HR views payroll for all employees
router.get('/', requireRole('hr'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.name AS employee_name, u.email AS employee_email
      FROM payroll p
      JOIN users u ON u.id = p.employee_id
      WHERE u.role = 'employee'
      ORDER BY u.name`);
    return res.json(rows);
  } catch (err) {
    console.error('Fetch all payroll error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/payroll/:employeeId - HR updates salary structure
// Employees hitting this route are blocked by requireRole('hr') below -
// this enforces "employee view is read-only" at the API layer, not just the UI.
router.put('/:employeeId', requireRole('hr'), async (req, res) => {
  const { employeeId } = req.params;
  const { basic_salary, hra, allowances, deductions } = req.body;

  const fields = { basic_salary, hra, allowances, deductions };
  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined && (typeof val !== 'number' || val < 0)) {
      return res.status(400).json({ error: `${key} must be a non-negative number` });
    }
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO payroll (employee_id, basic_salary, hra, allowances, deductions, updated_by, updated_at)
       SELECT $1, COALESCE($2,0), COALESCE($3,0), COALESCE($4,0), COALESCE($5,0), $6, NOW()
       FROM users
       WHERE id = $1 AND role = 'employee'
       ON CONFLICT (employee_id) DO UPDATE SET
         basic_salary = COALESCE($2, payroll.basic_salary),
         hra = COALESCE($3, payroll.hra),
         allowances = COALESCE($4, payroll.allowances),
         deductions = COALESCE($5, payroll.deductions),
         updated_by = $6,
         updated_at = NOW()
       RETURNING *`,
      [employeeId, basic_salary, hra, allowances, deductions, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('Update payroll error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
