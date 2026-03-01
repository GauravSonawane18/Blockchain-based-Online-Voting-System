import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8080' });

// Attach JWT token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auto-logout on 401
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  verify2fa:(data) => api.post('/api/auth/verify-2fa', data),
  getProfile: ()  => api.get('/api/auth/profile'),
};

// ── Admin ──────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getPending:    ()           => api.get('/api/admin/pending-voters'),
  approve:       (id)         => api.post(`/api/admin/approve-voter/${id}`),
  reject:        (id, reason) => api.post(`/api/admin/reject-voter/${id}`, { reason }),
  assignVoter:   (voterId, electionId) => api.post('/api/admin/assign-voter', { voterId, electionId }),
  getStats:      ()           => api.get('/api/admin/stats'),
  getAllVoters:   ()           => api.get('/api/admin/all-voters'),
};

// ── Elections ─────────────────────────────────────────────────────────────────
export const electionAPI = {
  getAll:    ()   => api.get('/api/elections'),
  getActive: ()   => api.get('/api/elections/active'),
  getById:   (id) => api.get(`/api/elections/${id}`),
  getMyElections: () => api.get('/api/elections/my-elections'),
  create:    (data) => api.post('/api/elections', data),
  start:     (id)   => api.post(`/api/elections/${id}/start`),
  end:       (id)   => api.post(`/api/elections/${id}/end`),
};

// ── Candidates ────────────────────────────────────────────────────────────────
export const candidateAPI = {
  getByElection: (electionId) => api.get(`/api/candidates/election/${electionId}`),
  add: (data) => api.post('/api/candidates', data),
};

// ── Voting ────────────────────────────────────────────────────────────────────
export const voteAPI = {
  castVote:  (electionId, candidateId) => api.post('/api/votes/cast', { electionId, candidateId }),
  hasVoted:  (electionId)              => api.get(`/api/votes/has-voted/${electionId}`),
  myVotes:   ()                        => api.get('/api/votes/my-votes'),
};

// ── Results ───────────────────────────────────────────────────────────────────
export const resultAPI = {
  getResults: (electionId) => api.get(`/api/results/${electionId}`),
};

// ── Audit ─────────────────────────────────────────────────────────────────────
export const auditAPI = {
  getLogs:  (page = 0, size = 20) => api.get(`/api/audit/logs?page=${page}&size=${size}`),
  getBlockchainTxs: ()            => api.get('/api/audit/blockchain-txs'),
};

export default api;