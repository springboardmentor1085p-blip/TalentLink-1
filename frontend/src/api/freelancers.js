import client from './client';

export const freelancersAPI = {
  list: (params) => client.get('/profiles/freelancer/', { params }),
  get: (id) => client.get(`/profiles/freelancer/${id}/`),
};

