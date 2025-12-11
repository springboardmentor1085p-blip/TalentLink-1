// import client from './client';

// // Create or return an existing one-to-one thread with a given user
// const getOrCreateThreadWith = (userId) =>
//   client.post('/messages/threads/with/', { user_id: userId });

// export const messagesAPI = {
//   list: (params) => client.get('/messages/', { params }),
//   send: (data) => client.post('/messages/', data),
//   getConversations: () => client.get('/messages/conversations/'),
//   getWithUser: (userId) => client.get('/messages/with_user/', { params: { user_id: userId } }),
//   getOrCreateThreadWith,
// };


import client from './client';

export const messagesAPI = {
  // Get all conversations
  getConversations: () => client.get('/messages/conversations/'),
  
  // Get messages with a specific user
  getWithUser: (userId) => client.get(`/messages/with/${userId}/`),
  
  // Send a message
  send: (data) => client.post('/messages/', data),
  
  // Get or create thread with user (for chat navigation)
  getOrCreateThreadWith: (userId) => 
    client.post('/messages/thread/create/', { user_id: userId }),
  
  // Mark messages as read
  markAsRead: (messageIds) => 
    client.post('/messages/mark-read/', { message_ids: messageIds }),
};