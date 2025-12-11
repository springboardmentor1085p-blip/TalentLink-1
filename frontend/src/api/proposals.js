// frontend/src/api/proposals.js
import client from './client';

export const proposalsAPI = {
  list: (params) => client.get('/proposals/', { params }),
  get: (id) => client.get(`/proposals/${id}/`),        // 
  create: (data) => client.post('/proposals/', data),
  accept: (id) => client.post(`/proposals/${id}/accept/`),
  reject: (id) => client.post(`/proposals/${id}/reject/`),
};
