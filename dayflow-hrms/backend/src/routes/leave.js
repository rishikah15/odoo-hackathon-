const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const LEAVE_TYPES = ['paid', 'sick', 'unpaid'];

router.use(authenticate);

// POST /api/leave - employee submits a leave request
router.post('/', requireRole('employee', 'hr'), async (req, res) => {
  const { leave_type, start_date, end_date, remarks } = req.body;

  if (!LEAVE_TYPES.includes(leave_type)) {
    return res.status(400).json({ error: `leave_type must be one of ${LEAVE_TYPES.join(', ')}` });
  }
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date are required' });
  }
  if (new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({ error: 'end_date cannot be before start_date' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, remarks)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, leave_type, start_date, end_date, remarks || null]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create leave error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leave/mine - employee views own requests
router.get('/mine', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM leave_requests WHERE employee_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('Fetch own leave error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leave - HR views all requests (optionally filter by status)
router.get('/', requireRole('hr'), async (req, res) => {
  const { status } = req.query;
  try {
    const params = [];
    let query = `
      SELECT lr.*, u.name AS employee_name, u.email AS employee_email
      FROM leave_requests lr
      JOIN users u ON u.id = lr.employee_id`;
    if (status) {
      params.push(status);
      query += ` WHERE lr.status = $1`;
    }
    query += ` ORDER BY lr.created_at DESC`;
    const { rows } = await pool.query(query, params);
    return res.json(rows);
  } catch (err) {
    console.error('Fetch all leave error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/leave/:id/decision - HR approves or rejects, with optional comment
router.put('/:id/decision', requireRole('hr'), async (req, res) => {
  const { id } = req.params;
  const { decision, comment } = req.body; // decision: 'approved' | 'rejected'

  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: "decision must be 'approved' or 'rejected'" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE leave_requests
       SET status = $1, hr_comment = $2, decided_by = $3, decided_at = NOW()
       WHERE id = $4 AND status = 'pending'
       RETURNING *`,
      [decision, comment || null, req.user.id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found or already decided' });
    }

    const updated = rows[0];

    // Real-time push so the employee sees the status change immediately.
    const io = req.app.get('io');
    if (io) {
      io.to(`employee:${updated.employee_id}`).emit('leave:update', updated);
    }

    return res.json(updated);
  } catch (err) {
    console.error('Decision error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
