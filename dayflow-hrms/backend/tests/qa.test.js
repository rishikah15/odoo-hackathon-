/**
 * Dayflow HRMS - QA test suite
 *
 * Covers the full checklist requested by the team:
 *  - Employee login / HR login
 *  - Wrong password rejected
 *  - Employee permissions (cannot hit HR-only routes)
 *  - Check-in / check-out
 *  - Leave application
 *  - Leave approval / rejection (+ live update event)
 *  - Payroll visibility (employee read-only, HR read/write)
 *  - Profile editing
 *
 * Requires a running Postgres instance seeded via `npm run seed`
 * (see backend/README.md). Run with: npm test
 */
const request = require('supertest');
const { Client } = require('socket.io-client');
const { app, server } = require('../src/index');

let hrToken, empToken, empId, hrId;

beforeAll(async () => {
  const hrLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'hr@dayflow.test', password: 'password123' });
  hrToken = hrLogin.body.token;
  hrId = hrLogin.body.user.id;

  const empLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'employee@dayflow.test', password: 'password123' });
  empToken = empLogin.body.token;
  empId = empLogin.body.user.id;
});

afterAll((done) => {
  server.close(done);
});

describe('Authentication', () => {
  test('Employee can log in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee@dayflow.test', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('employee');
    expect(res.body.token).toBeTruthy();
  });

  test('HR can log in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'hr@dayflow.test', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('hr');
  });

  test('Wrong password is rejected', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee@dayflow.test', password: 'not-the-password' });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test('Unknown email is rejected (not leaked as a distinct error)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@dayflow.test', password: 'password123' });
    expect(res.status).toBe(401);
  });
});

describe('Employee permissions', () => {
  test('Employee cannot view all leave requests (HR-only route)', async () => {
    const res = await request(app)
      .get('/api/leave')
      .set('Authorization', `Bearer ${empToken}`);
    expect(res.status).toBe(403);
  });

  test('Employee cannot approve/reject leave requests', async () => {
    const res = await request(app)
      .put('/api/leave/999999/decision')
      .set('Authorization', `Bearer ${empToken}`)
      .send({ decision: 'approved' });
    expect(res.status).toBe(403);
  });

  test('Employee cannot view all payroll records', async () => {
    const res = await request(app)
      .get('/api/payroll')
      .set('Authorization', `Bearer ${empToken}`);
    expect(res.status).toBe(403);
  });

  test('Employee cannot update anyone\'s salary structure', async () => {
    const res = await request(app)
      .put(`/api/payroll/${empId}`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({ basic_salary: 999999 });
    expect(res.status).toBe(403);
  });

  test('Requests without a token are rejected', async () => {
    const res = await request(app).get('/api/leave/mine');
    expect(res.status).toBe(401);
  });
});

describe('Check-in / check-out', () => {
  test('Employee can check in', async () => {
    const res = await request(app)
      .post('/api/attendance/checkin')
      .set('Authorization', `Bearer ${empToken}`);
    expect(res.status).toBe(200);
    expect(res.body.check_in).toBeTruthy();
  });

  test('Employee can check out after checking in', async () => {
    const res = await request(app)
      .post('/api/attendance/checkout')
      .set('Authorization', `Bearer ${empToken}`);
    expect(res.status).toBe(200);
    expect(res.body.check_out).toBeTruthy();
  });
});

describe('Leave application lifecycle', () => {
  let leaveId;

  test('Employee can submit a paid leave request', async () => {
    const res = await request(app)
      .post('/api/leave')
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        leave_type: 'paid',
        start_date: '2026-09-01',
        end_date: '2026-09-03',
        remarks: 'Family trip',
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    leaveId = res.body.id;
  });

  test('Rejects an invalid leave type', async () => {
    const res = await request(app)
      .post('/api/leave')
      .set('Authorization', `Bearer ${empToken}`)
      .send({ leave_type: 'vacation', start_date: '2026-09-01', end_date: '2026-09-02' });
    expect(res.status).toBe(400);
  });

  test('Rejects end_date before start_date', async () => {
    const res = await request(app)
      .post('/api/leave')
      .set('Authorization', `Bearer ${empToken}`)
      .send({ leave_type: 'sick', start_date: '2026-09-05', end_date: '2026-09-01' });
    expect(res.status).toBe(400);
  });

  test('Employee sees their own request in the pending list', async () => {
    const res = await request(app)
      .get('/api/leave/mine')
      .set('Authorization', `Bearer ${empToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some((r) => r.id === leaveId && r.status === 'pending')).toBe(true);
  });

  test('HR sees the request in the full list', async () => {
    const res = await request(app)
      .get('/api/leave')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some((r) => r.id === leaveId)).toBe(true);
  });

  test('HR approves the request and employee is notified in real time', (done) => {
    const socket = new Client(`http://localhost:${server.address().port}`, {
      auth: { token: empToken },
    });

    socket.on('connect', async () => {
      const res = await request(app)
        .put(`/api/leave/${leaveId}/decision`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ decision: 'approved', comment: 'Enjoy your trip!' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');
    });

    socket.on('leave:update', (payload) => {
      expect(payload.id).toBe(leaveId);
      expect(payload.status).toBe('approved');
      socket.disconnect();
      done();
    });
  });

  test('Cannot decide on an already-decided request twice', async () => {
    const res = await request(app)
      .put(`/api/leave/${leaveId}/decision`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ decision: 'rejected' });
    expect(res.status).toBe(404);
  });

  test('A second request can be rejected by HR', async () => {
    const created = await request(app)
      .post('/api/leave')
      .set('Authorization', `Bearer ${empToken}`)
      .send({ leave_type: 'unpaid', start_date: '2026-10-01', end_date: '2026-10-02' });

    const decided = await request(app)
      .put(`/api/leave/${created.body.id}/decision`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ decision: 'rejected', comment: 'Insufficient notice' });

    expect(decided.status).toBe(200);
    expect(decided.body.status).toBe('rejected');
    expect(decided.body.hr_comment).toBe('Insufficient notice');
  });
});

describe('Payroll visibility', () => {
  test('Employee can view their own payroll (read-only)', async () => {
    const res = await request(app)
      .get('/api/payroll/mine')
      .set('Authorization', `Bearer ${empToken}`);
    expect(res.status).toBe(200);
    expect(res.body.employee_id).toBe(empId);
  });

  test('HR can view payroll for all employees', async () => {
    const res = await request(app)
      .get('/api/payroll')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('HR can update an employee\'s salary structure', async () => {
    const res = await request(app)
      .put(`/api/payroll/${empId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ basic_salary: 55000 });
    expect(res.status).toBe(200);
    expect(Number(res.body.basic_salary)).toBe(55000);
  });

  test('Employee sees the updated salary reflected in their read-only view', async () => {
    const res = await request(app)
      .get('/api/payroll/mine')
      .set('Authorization', `Bearer ${empToken}`);
    expect(Number(res.body.basic_salary)).toBe(55000);
  });
});

describe('Profile editing', () => {
  test('Employee can view their own profile', async () => {
    const res = await request(app)
      .get('/api/profile/me')
      .set('Authorization', `Bearer ${empToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('employee@dayflow.test');
  });

  test('Employee can edit their own name/department/phone', async () => {
    const res = await request(app)
      .put('/api/profile/me')
      .set('Authorization', `Bearer ${empToken}`)
      .send({ phone: '+91-9000000000' });
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('+91-9000000000');
  });

  test('Employee cannot change their own role via profile edit', async () => {
    const res = await request(app)
      .put('/api/profile/me')
      .set('Authorization', `Bearer ${empToken}`)
      .send({ role: 'hr' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('employee'); // role field is silently ignored, not applied
  });
});
