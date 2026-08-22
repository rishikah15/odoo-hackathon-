const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/profile/me
router.get('/me', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, department, phone FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('Fetch profile error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile/me - a user may only edit their own profile.
// Note: role and email are intentionally not editable here to prevent
// self-escalation to 'hr' or account takeover via email swap.
router.put('/me', async (req, res) => {
  const { name, department, phone } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET
         name = COALESCE($1, name),
         department = COALESCE($2, department),
         phone = COALESCE($3, phone)
       WHERE id = $4
       RETURNING id, name, email, role, department, phone`,
      [name, department, phone, req.user.id]
    );
    return res.json(rows[0]);
  } catch (err) {
    console.error('Update profile error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
