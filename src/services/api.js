// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('ilmpath-token');

// API client with auth header
const apiClient = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// Auth API
export const authAPI = {
  register: (userData) =>
    apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () => apiClient('/auth/me'),

  updateProfile: (data) =>
    apiClient('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Courses API
export const coursesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/courses${query ? `?${query}` : ''}`);
  },

  getById: (id) => apiClient(`/courses/${id}`),

  create: (data) =>
    apiClient('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiClient(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiClient(`/courses/${id}`, { method: 'DELETE' }),

  // Admin endpoint
  getAllAdmin: () => apiClient('/courses/all'),

  updateLearningPath: (id, learningPath) =>
    apiClient(`/courses/${id}/learning-path`, {
      method: 'PUT',
      body: JSON.stringify({ learningPath }),
    }),
};

// Chapters API
export const chaptersAPI = {
  getByCourse: (courseId) => apiClient(`/chapters?courseId=${courseId}`),

  getById: (id) => apiClient(`/chapters/${id}`),

  create: (data) =>
    apiClient('/chapters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiClient(`/chapters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiClient(`/chapters/${id}`, { method: 'DELETE' }),

  getAllAdmin: (courseId) =>
    apiClient(`/chapters/all${courseId ? `?courseId=${courseId}` : ''}`),
};

// Quizzes API
export const quizzesAPI = {
  getByCourse: (courseId) => apiClient(`/quizzes?courseId=${courseId}`),

  getById: (id) => apiClient(`/quizzes/${id}`),

  submit: (id, answers) =>
    apiClient(`/quizzes/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  submitGuest: (id, answers) =>
    apiClient(`/quizzes/${id}/submit-guest`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  create: (data) =>
    apiClient('/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiClient(`/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiClient(`/quizzes/${id}`, { method: 'DELETE' }),

  getAllAdmin: () => apiClient('/quizzes/all'),
  getByIdAdmin: (id) => apiClient(`/quizzes/${id}/admin`),
};

// Progress API
export const progressAPI = {
  getAll: () => apiClient('/progress'),

  getByCourse: (courseId) => apiClient(`/progress/${courseId}`),

  completeChapter: (courseId, chapterId, readingProgress = 100) =>
    apiClient('/progress/chapter', {
      method: 'POST',
      body: JSON.stringify({ courseId, chapterId, readingProgress }),
    }),

  updateTime: (courseId, minutes) =>
    apiClient('/progress/time', {
      method: 'POST',
      body: JSON.stringify({ courseId, minutes }),
    }),

  getStats: () => apiClient('/progress/stats/overview'),
};

// Admin API
export const adminAPI = {
  getStats: () => apiClient('/admin/stats'),

  // Users
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/admin/users${query ? `?${query}` : ''}`);
  },

  getUser: (id) => apiClient(`/admin/users/${id}`),

  updateUser: (id, data) =>
    apiClient(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleUserStatus: (id) =>
    apiClient(`/admin/users/${id}/toggle-status`, { method: 'POST' }),

  promoteUser: (id) =>
    apiClient(`/admin/users/${id}/promote`, { method: 'POST' }),

  demoteUser: (id) =>
    apiClient(`/admin/users/${id}/demote`, { method: 'POST' }),

  deleteUser: (id) =>
    apiClient(`/admin/users/${id}`, { method: 'DELETE' }),
};

// Content Requests API
export const requestsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/requests${query ? `?${query}` : ''}`);
  },

  getById: (id) => apiClient(`/requests/${id}`),

  create: (data) =>
    apiClient('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiClient(`/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  approve: (id, reviewNote) =>
    apiClient(`/requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reviewNote }),
    }),

  reject: (id, reviewNote) =>
    apiClient(`/requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reviewNote }),
    }),

  delete: (id) =>
    apiClient(`/requests/${id}`, { method: 'DELETE' }),
};

// Tickets API (Support System)
export const ticketsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/tickets${query ? `?${query}` : ''}`);
  },

  getById: (id) => apiClient(`/tickets/${id}`),

  create: (data) =>
    apiClient('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendMessage: (id, content) =>
    apiClient(`/tickets/${id}/message`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  assign: (id, assignedTo) =>
    apiClient(`/tickets/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ assignedTo }),
    }),

  updateStatus: (id, status, resolution) =>
    apiClient(`/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolution }),
    }),

  delete: (id) =>
    apiClient(`/tickets/${id}`, { method: 'DELETE' }),

  getStats: () => apiClient('/tickets/stats'),
};

export default apiClient;


