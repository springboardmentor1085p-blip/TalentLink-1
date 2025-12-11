import client from './client';

export const jobsAPI = {
  list: (params) => client.get('/jobs/', { params }),
  get: (id) => client.get(`/jobs/${id}/`),

  create: (formData) =>
    client.post('/jobs/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id, formData) =>
    client.put(`/jobs/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  patch: (id, data) => client.patch(`/jobs/${id}/`, data),
  remove: (id) => client.delete(`/jobs/${id}/`),
};
