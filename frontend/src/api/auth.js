// api/auth.js
import client from './client';

export const authAPI = {
  register: (data) => client.post('/users/register/', data),
  login: (email, password) => client.post('/token/', { email, password }),
  me: () => client.get('/users/me/'),

  updateUser: (data) => {
    if (data instanceof FormData) {
      return client.put('/users/update_me/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return client.put('/users/update_me/', data);
  },

  updateProfile: (data) => client.put('/profiles/freelancer/me/', data),

  getFreelancerProfile: () => client.get('/profiles/freelancer/me/'),

  getClientProfile: () => client.get('/profiles/client/me/'),

  updateClientProfile: (data) => client.put('/profiles/client/me/', data),
  getMyProposals: () => client.get('/proposals/'),
  getMyContracts: () => client.get('/contracts/'),

  uploadPortfolioFiles: (formData) => {
    return client.post('/profiles/freelancer/me/upload-portfolio-files/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  deletePortfolioFile: (fileId) => {
    return client.delete(`/profiles/freelancer/me/delete-portfolio-file/${fileId}/`);
  },

  // 🔐 Forgot password
  forgotPassword: (email) =>
    client.post('/users/forgot-password/', { email }),

  // 🔐 Reset password confirm
  resetPasswordConfirm: (data) =>
    client.post('/users/reset-password/', data),

  // 🔥 Delete account
  deleteAccount: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    return client.delete('/users/delete-account/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
