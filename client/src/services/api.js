import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Axios instance — all requests go through here
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT automatically from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sl_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler — clear stale tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sl_token');
      localStorage.removeItem('sl_user');
      // Redirect to login only if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Projects ────────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  remove: (id) => api.delete(`/projects/${id}`),
};

// ─── Scope Items ─────────────────────────────────────────────────────────────
export const scopeAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/scope-items`),
  create: (projectId, data) => api.post(`/projects/${projectId}/scope-items`, data),
  update: (id, data) => api.put(`/scope-items/${id}`, data),
  remove: (id) => api.delete(`/scope-items/${id}`),
};

// ─── Client Requests ─────────────────────────────────────────────────────────
export const requestsAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/requests`),
  createChangeOrder: (requestId, data) =>
    api.post(`/requests/${requestId}/change-order`, data),
};

// ─── Change Orders ───────────────────────────────────────────────────────────
export const changeOrdersAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/change-orders`),
  getOne: (id) => api.get(`/change-orders/${id}`),
  update: (id, data) => api.put(`/change-orders/${id}`, data),
  send: (id) => api.put(`/change-orders/${id}/send`),
  remove: (id) => api.delete(`/change-orders/${id}`),
};

// ─── Portal (Public) ─────────────────────────────────────────────────────────
// Uses a separate axios instance with no Authorization header
// so the JWT interceptor never fires on public portal requests.
const portalAxios = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

export const portalAPI = {
  getProject: (token) => portalAxios.get(`/portal/${token}`),
  getTags: (token) => portalAxios.get(`/portal/${token}/tags`),
  submitRequest: (token, data) => portalAxios.post(`/portal/${token}/requests`, data),
  getTimeline: (token) => portalAxios.get(`/portal/${token}/timeline`),
  getChangeOrders: (token) => portalAxios.get(`/portal/${token}/change-orders`),
  approveChangeOrder: (token, id) =>
    portalAxios.put(`/portal/${token}/change-orders/${id}/approve`),
  declineChangeOrder: (token, id) =>
    portalAxios.put(`/portal/${token}/change-orders/${id}/decline`),
};

// ─── Timeline ────────────────────────────────────────────────────────────────
export const timelineAPI = {
  get: (projectId) => api.get(`/projects/${projectId}/timeline`),
};

// ─── Notifications ────────────────────────────────────────────────────────────
// NOTE: Uses PUT (not PATCH) — server routes updated to match.
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export default api;
