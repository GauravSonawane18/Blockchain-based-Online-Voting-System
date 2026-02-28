import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8080/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: (formData) => api.post('/auth/register', formData),
  login: (data) => api.post('/auth/login', data),
  verify2fa: (data) => api.post('/auth/verify-2fa', data),
  setup2fa: () => api.get('/auth/setup-2fa'),
  confirm2fa: (code) => api.post('/auth/confirm-2fa', { code }),
  me: () => api.get('/auth/me'),
};

export const electionAPI = {
  getAll: () => api.get('/elections'),
  getActive: () => api.get('/elections/active'),
  getById: (id) => api.get(`/elections/${id}`),
  getMyElections: () => api.get('/elections/my-elections'),
  create: (data) => api.post('/elections', data),
  start: (id) => api.post(`/elections/${id}/start`),
  end: (id) => api.post(`/elections/${id}/end`),
};

export const candidateAPI = {
  getByElection: (id) => api.get(`/candidates/election/${id}`),
  add: (data) => api.post('/candidates', data),
};

export const voteAPI = {
  requestOtp: (electionId) => api.post('/votes/request-otp', { electionId }),
  verifyOtp: (electionId, otpCode) => api.post('/votes/verify-otp', { electionId, otpCode }),
  saveReceipt: (data) => api.post('/votes/save-receipt', data),
  getStatus: (electionId) => api.get(`/votes/status/${electionId}`),
};

export const resultAPI = {
  getResults: (electionId) => api.get(`/results/${electionId}`),
};

export const adminAPI = {
  getPending: () => api.get('/admin/pending-voters'),
  approve: (id) => api.post(`/admin/approve-voter/${id}`),
  reject: (id, reason) => api.post(`/admin/reject-voter/${id}`, { reason }),
  assignVoter: (voterId, electionId) => api.post('/admin/assign-voter', { voterId, electionId }),
  getStats: () => api.get('/admin/stats'),
};

export const auditAPI = {
  getLogs: (page=0, size=20) => api.get(`/audit/logs?page=${page}&size=${size}`),
  getBlockchainTxs: () => api.get('/audit/blockchain-txs'),
};
