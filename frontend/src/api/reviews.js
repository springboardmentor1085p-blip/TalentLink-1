// frontend/src/api/reviews.js
import client from './client';

export const reviewsAPI = {
  // Get reviews for a user (public)
  getForUser: (userId, params = {}) => 
    client.get('/reviews/for_user/', { params: { user_id: userId, ...params } }),
  
  // Get review statistics
  getStats: (userId) => 
    client.get('/review-stats/for_user/', { params: { user_id: userId } }),
  
  // Create a review
  create: (data) => client.post('/reviews/', data),
  
  // Respond to a review
  respond: (reviewId, responseText) => 
    client.post(`/reviews/${reviewId}/respond/`, { response_text: responseText }),
  
  // Verify external review
  verify: (reviewId, token) => 
    client.post(`/reviews/${reviewId}/verify/`, { token }),
};