const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('dayflow_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),

  getMyLeaves: () => request('/api/leave/mine'),
  submitLeave: (payload) => request('/api/leave', { method: 'POST', body: payload }),
  getAllLeaves: (status) => request(`/api/leave${status ? `?status=${status}` : ''}`),
  decideLeave: (id, decision, comment) =>
    request(`/api/leave/${id}/decision`, { method: 'PUT', body: { decision, comment } }),

  getMyPayroll: () => request('/api/payroll/mine'),
  getAllPayroll: () => request('/api/payroll'),
  updatePayroll: (employeeId, payload) =>
    request(`/api/payroll/${employeeId}`, { method: 'PUT', body: payload }),

  checkIn: () => request('/api/attendance/checkin', { method: 'POST' }),
  checkOut: () => request('/api/attendance/checkout', { method: 'POST' }),
  getTodayAttendance: () => request('/api/attendance/today'),

  getMyProfile: () => request('/api/profile/me'),
  updateMyProfile: (payload) => request('/api/profile/me', { method: 'PUT', body: payload }),
};

export { BASE_URL, getToken };
