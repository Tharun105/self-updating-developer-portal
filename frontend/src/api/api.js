import client from './client';

const data = (promise) => promise.then((r) => r.data);

export const authApi = {
  login: (body) => data(client.post('/auth/login', body)),
  register: (body) => data(client.post('/auth/register', body)),
};

export const serviceApi = {
  list: (params) => data(client.get('/services', { params })),
  languages: () => data(client.get('/services/languages')),
  get: (id) => data(client.get(`/services/${id}`)),
  create: (body) => data(client.post('/services', body)),
  update: (id, body) => data(client.put(`/services/${id}`, body)),
  remove: (id) => client.delete(`/services/${id}`),
};

export const githubApi = {
  repos: (q = '') => data(client.get('/github/repos', { params: { q } })),
  importRepo: (id) => data(client.post(`/github/repos/${id}/import`)),
};

export const syncApi = {
  history: (limit = 20) => data(client.get('/sync/history', { params: { limit } })),
  run: (owner) =>
    data(client.post('/sync/manual', null, { params: owner ? { owner } : {}, timeout: 180000 })),
};

export const docApi = {
  list: (params) => data(client.get('/docs', { params })),
  get: (id) => data(client.get(`/docs/${id}`)),
  create: (body) => data(client.post('/docs', body)),
  update: (id, body) => data(client.put(`/docs/${id}`, body)),
  remove: (id) => client.delete(`/docs/${id}`),
};

export const dashboardApi = {
  stats: () => data(client.get('/dashboard/stats')),
  adminOverview: () => data(client.get('/admin/overview')),
};

export const userApi = {
  list: () => data(client.get('/users')),
  create: (body) => data(client.post('/users', body)),
  update: (id, body) => data(client.put(`/users/${id}`, body)),
  remove: (id) => client.delete(`/users/${id}`),
};
