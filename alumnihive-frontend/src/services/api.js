import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  getMentors: (params) => api.get('/users/mentors', { params }),
  becomeMentor: (data) => api.post('/users/become-mentor', data),
  getNotifications: (params) => api.get('/users/notifications', { params }),
  markNotificationRead: (id) => api.put(`/users/notifications/${id}/read`),
};

// Communities API
export const communitiesAPI = {
  getCommunities: (params) => api.get('/communities', { params }),
  getCommunityById: (id) => api.get(`/communities/${id}`),
  createCommunity: (data) => api.post('/communities', data),
  joinCommunity: (id, data) => api.post(`/communities/${id}/join`, data),
  leaveCommunity: (id) => api.post(`/communities/${id}/leave`),
};

// Messages API
export const messagesAPI = {
  getCommunityMessages: (communityId, params) =>
    api.get(`/messages/community/${communityId}`, { params }),
  getPrivateMessages: (userId, params) =>
    api.get(`/messages/private/${userId}`, { params }),
};

// Mentorship API
export const mentorshipAPI = {
  sendRequest: (data) => api.post('/mentorship/request', data),
  getRequests: () => api.get('/mentorship/requests'),
  respondToRequest: (id, data) => api.put(`/mentorship/requests/${id}/respond`, data),
  getMentorships: (params) => api.get('/mentorship/my-mentorships', { params }),
  addSession: (id, data) => api.post(`/mentorship/${id}/sessions`, data),
};

// Blogs API (updated)
export const blogsAPI = {
  getBlogs: (params) => api.get('/blogs', { params }),
  getBlogBySlug: (slug) => api.get(`/blogs/${slug}`),
  createBlog: (data) => api.post('/blogs', data),
  updateBlog: (id, data) => api.put(`/blogs/${id}`, data),
  deleteBlog: (id) => api.delete(`/blogs/${id}`),
  likeBlog: (id) => api.post(`/blogs/${id}/like`),
  addComment: (id, data) => api.post(`/blogs/${id}/comments`, data),
  getMyBlogs: () => api.get('/blogs/my/all'),
};

// Q&A API
export const qaAPI = {
  getQuestions: (params) => api.get('/qa', { params }),
  getQuestionById: (id) => api.get(`/qa/${id}`),
  createQuestion: (data) => api.post('/qa', data),
  addAnswer: (id, data) => api.post(`/qa/${id}/answers`, data),
  voteQuestion: (id, data) => api.post(`/qa/${id}/vote`, data),
  voteAnswer: (questionId, answerId, data) =>
    api.post(`/qa/${questionId}/answers/${answerId}/vote`, data),
  acceptAnswer: (questionId, answerId) =>
    api.post(`/qa/${questionId}/answers/${answerId}/accept`),
};

// Events API
export const eventsAPI = {
  getEvents: (params) => api.get('/events', { params }),
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post('/events', data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  registerForEvent: (id) => api.post(`/events/${id}/register`),
};

export default api;
