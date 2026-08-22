// Usage: node src/db/seed.js
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);

  const { rows: hr } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, department)
     VALUES ('Asha HR', 'hr@dayflow.test', $1, 'hr', 'Human Resources')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [hash]
  );

  const { rows: emp } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, department)
     VALUES ('Rahul Employee', 'employee@dayflow.test', $1, 'employee', 'Engineering')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [hash]
  );

  await pool.query(
    `INSERT INTO payroll (employee_id, basic_salary, hra, allowances, deductions, updated_by)
     VALUES ($1, 50000, 15000, 5000, 2000, $2)
     ON CONFLICT (employee_id) DO NOTHING`,
    [emp[0].id, hr[0].id]
  );

  console.log('Seed complete.');
  console.log(`  HR login:       hr@dayflow.test / ${password}`);
  console.log(`  Employee login: employee@dayflow.test / ${password}`);
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
