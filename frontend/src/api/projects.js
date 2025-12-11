import client from './client';

export const projectsAPI = {
  list: (params) => client.get('/projects/', { params }),
  get: (id) => client.get(`/projects/${id}/`),

  create: (data) => client.post('/projects/', data),

  createMultipart: (formData) =>
    client.post('/projects/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id, data) => client.put(`/projects/${id}/`, data),
  patch: (id, data) => client.patch(`/projects/${id}/`, data),

  delete: (id) => client.delete(`/projects/${id}/`),
  remove: (id) => client.delete(`/projects/${id}/`), // alias (kept explicit)

  getProposals: (projectId) => client.get(`/projects/${projectId}/proposals/`),
};
