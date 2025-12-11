import client from './client';

export const workspacesAPI = {
  // Workspaces
  list: () => client.get('/workspaces/'),
  get: (id) => client.get(`/workspaces/${id}/`),
  markComplete: (id) => client.post(`/workspaces/${id}/mark_complete/`),
  getPaymentStats: (id) => client.get(`/workspaces/${id}/payment_stats/`),
  
  // Tasks
  getTasks: (workspaceId) => client.get('/tasks/', { params: { workspace: workspaceId } }),
  getTask: (id) => client.get(`/tasks/${id}/`),
  createTask: (data) => client.post('/tasks/', data),
  updateTask: (id, data) => client.patch(`/tasks/${id}/`, data),
  deleteTask: (id) => client.delete(`/tasks/${id}/`),
  updateTaskStatus: (id, status) => client.post(`/tasks/${id}/update_status/`, { status }),
  addTaskComment: (id, comment) => client.post(`/tasks/${id}/add_comment/`, { comment }),
  
  // Payments
  getPayments: (workspaceId) => client.get('/payments/', { params: { workspace: workspaceId } }),
  createPayment: (data) => client.post('/payments/', data),
  confirmPayment: (id) => client.post(`/payments/${id}/confirm/`),
  
  // Payment Requests
  getPaymentRequests: (workspaceId) => client.get('/payment-requests/', { params: { workspace: workspaceId } }),
  createPaymentRequest: (data) => client.post('/payment-requests/', data),
  approvePaymentRequest: (id) => client.post(`/payment-requests/${id}/approve/`),
  rejectPaymentRequest: (id, reason) => client.post(`/payment-requests/${id}/reject/`, { reason }),
};