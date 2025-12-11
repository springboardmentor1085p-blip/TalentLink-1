
import client from './client';

export const contractsAPI = {
  list: (params) => client.get('/contracts/', { params }),
  get: (id) => client.get(`/contracts/${id}/`),
  sign: (id) => client.post(`/contracts/${id}/sign/`),
  complete: (id) => client.post(`/contracts/${id}/complete/`),
  update: (id, data) => client.patch(`/contracts/${id}/`, data),
};