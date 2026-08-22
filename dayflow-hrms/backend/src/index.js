const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const leaveRoutes = require('./routes/leave');
const payrollRoutes = require('./routes/payroll');
const attendanceRoutes = require('./routes/attendance');
const profileRoutes = require('./routes/profile');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 404 + error handlers
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

// Each socket authenticates with the same JWT used for REST calls, then
// joins a room scoped to their user id so HR decisions can be pushed
// straight to the affected employee only.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const payload = jwt.verify(token, JWT_SECRET);
    socket.user = payload;
    next();
  } catch (err) {
    next(new Error('Unauthorized socket connection'));
  }
});

io.on('connection', (socket) => {
  socket.join(`employee:${socket.user.id}`);
  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  server.listen(PORT, () => console.log(`Dayflow HRMS backend listening on :${PORT}`));
}

module.exports = { app, server, io };
