const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/attendance/checkin
router.post('/checkin', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO attendance (employee_id, check_in, work_date)
       VALUES ($1, NOW(), CURRENT_DATE)
       ON CONFLICT (employee_id, work_date) DO UPDATE SET check_in = COALESCE(attendance.check_in, NOW())
       RETURNING *`,
      [req.user.id]
    );
    return res.json(rows[0]);
  } catch (err) {
    console.error('Check-in error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/attendance/checkout
router.post('/checkout', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE attendance SET check_out = NOW()
       WHERE employee_id = $1 AND work_date = CURRENT_DATE
       RETURNING *`,
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Must check in before checking out' });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error('Check-out error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/attendance/today
router.get('/today', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM attendance WHERE employee_id = $1 AND work_date = CURRENT_DATE`,
      [req.user.id]
    );
    return res.json(rows[0] || null);
  } catch (err) {
    console.error('Fetch attendance error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
