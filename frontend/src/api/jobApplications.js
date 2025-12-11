// frontend/src/api/jobApplications.js
import client from './client';

export const jobApplicationsAPI = {
  list: (params) => client.get('/job-applications/', { params }),
  get: (id) => client.get(`/job-applications/${id}/`),
  create: (formData) => 
    client.post('/job-applications/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  accept: (id) => client.post(`/job-applications/${id}/accept/`),
  reject: (id) => client.post(`/job-applications/${id}/reject/`),
};