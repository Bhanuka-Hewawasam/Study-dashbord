import axios from 'axios';

/**
 * StudyPilot API Client
 * Configures base URL from Vite environment variables and attaches
 * the secret token to headers for authorized write operations.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const API_TOKEN = import.meta.env.VITE_API_TOKEN || 'pilot-secret-token';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Token': API_TOKEN,
  },
  timeout: 10000,
});

// Interceptor to ensure token is dynamically included on all outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    if (!config.headers['X-API-Token']) {
      config.headers['X-API-Token'] = API_TOKEN;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for clear console debugging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      `[StudyPilot API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

/* --------------------------------------------------------------------------
   API SERVICE ENDPOINTS
   -------------------------------------------------------------------------- */

// Study Sessions API (supports subject, date_from, date_to, search filters)
export const flightsApi = {
  getAll: (params = {}) =>
    apiClient.get('/flights/', { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/flights/${id}/`).then((res) => res.data),
  create: (flightData) =>
    apiClient.post('/flights/', flightData).then((res) => res.data),
  update: (id, flightData) =>
    apiClient.put(`/flights/${id}/`, flightData).then((res) => res.data),
  patch: (id, flightData) =>
    apiClient.patch(`/flights/${id}/`, flightData).then((res) => res.data),
  delete: (id) => apiClient.delete(`/flights/${id}/`).then((res) => res.data),
};

// Subjects Autocomplete & History API
export const subjectsApi = {
  getAll: () => apiClient.get('/subjects/').then((res) => res.data),
};

// Daily Goal API
export const flightPlanApi = {
  get: () => apiClient.get('/flight-plan/').then((res) => res.data),
  update: (dailyGoalMinutes) =>
    apiClient
      .patch('/flight-plan/', { daily_goal_minutes: dailyGoalMinutes })
      .then((res) => res.data),
};

// Summary Telemetry Stats API
export const statsApi = {
  get: () => apiClient.get('/stats/').then((res) => res.data),
};

// Monthly Reports API
export const reportsApi = {
  getMonthly: (monthStr) =>
    apiClient
      .get('/reports/monthly/', { params: monthStr ? { month: monthStr } : {} })
      .then((res) => res.data),
};

// Journey Tracker Milestones API
export const journeyApi = {
  get: () => apiClient.get('/journey/').then((res) => res.data),
};

export default apiClient;
