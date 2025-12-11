import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Upload, X, Send, Paperclip, Download } from 'lucide-react';
import { messagesAPI } from '../api/messages';
import client from '../api/client';

export default function Messages({ user }) {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const justOpenedRef = useRef(false);
  
  const [searchParams] = useSearchParams();

  const isNearBottom = (el, threshold = 120) => {
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  useEffect(() => {
    loadConversations();
    const conversationInterval = setInterval(loadConversations, 5000);
    return () => clearInterval(conversationInterval);
  }, []);

  // Handle URL parameter to auto-select conversation
  useEffect(() => {
    // accept both ?user= and ?userId= for compatibility
    const userId = searchParams.get('user') || searchParams.get('userId');

    if (userId && conversations.length > 0) {
      const foundConv = conversations.find(c => String(c.id) === String(userId));
      if (foundConv) {
        setSelectedUser(foundConv);
      } else {
        // User not in conversations, fetch their details (start new chat)
        fetchAndStartConversation(userId);
      }
    } else if (userId && conversations.length === 0) {
      // conversations may load a bit later; ensure we still fetch user so UI opens
      fetchAndStartConversation(userId);
    }
  }, [searchParams, conversations]);

  const fetchAndStartConversation = async (userId) => {
    try {
      const response = await client.get(`/users/${userId}/`);
      const userData = response.data;
      const newUser = {
        id: userData.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        role: userData.role,
      };
      setSelectedUser(newUser);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      justOpenedRef.current = true;
      loadMessages();

      setTimeout(() => {
        const el = messagesContainerRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
      }, 100);

      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    const el = messagesContainerRef.current;

    if (justOpenedRef.current) {
      if (el) {
        setTimeout(() => {
          el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
        }, 100);
      }
      justOpenedRef.current = false;
      return;
    }

    if (isNearBottom(el)) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const res = await messagesAPI.getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadMessages = async () => {
    if (selectedUser) {
      try {
        const res = await messagesAPI.getWithUser(selectedUser.id);
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    }
  };

  const searchUsers = async () => {
    try {
      const response = await client.get('/messages/search_users/', {
        params: { q: searchQuery }
      });
      setSearchResults(response.data);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('recipient', selectedUser.id);
      formData.append('content', newMessage || 'Sent a file');
      
      if (selectedFile) {
        formData.append('file_attachment', selectedFile);
      }

      await client.post('/messages/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setNewMessage('');
      setSelectedFile(null);
      await loadMessages();
      await loadConversations();
      
      setTimeout(() => {
        const el = messagesContainerRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const startConversation = (user) => {
    setSelectedUser(user);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return null;
    const ext = fileUrl.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return '🖼️';
    } else if (['pdf'].includes(ext)) {
      return '📄';
    } else if (['doc', 'docx'].includes(ext)) {
      return '📝';
    } else if (['zip', 'rar'].includes(ext)) {
      return '📦';
    }
    return '📎';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Messages</h1>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Search size={18} />
            New Message
          </button>
        </div>

        {/* Search Modal */}
        {showSearch && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Search Users</h2>
              <button onClick={() => setShowSearch(false)}>
                <X size={24} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => startConversation(user)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-200"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.role === 'freelancer' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchQuery.length >= 2 && searchResults.length === 0 && (
              <p className="text-gray-600 text-center py-4">No users found</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '600px' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-lg">Conversations</h2>
              </div>
              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedUser(conv)}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                      selectedUser?.id === conv.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-semibold">
                          {conv.first_name?.[0]}{conv.last_name?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{conv.first_name} {conv.last_name}</h3>
                        <p className="text-sm text-gray-600 truncate">{conv.email}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-gray-600 text-center">
                  No conversations yet. Search for users to start chatting!
                </div>
              )}
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
              {selectedUser ? (
                <>
                  <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">
                          {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {selectedUser.first_name} {selectedUser.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedUser.role === 'freelancer' ? '💼 Freelancer' : '🏢 Client'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                  >
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender === user.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.sender === user.id
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="break-words">{msg.content}</p>
                          {msg.file_url && (
                            <a
                              href={`http://127.0.0.1:8000${msg.file_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className={`flex items-center gap-2 mt-2 p-2 rounded ${
                                msg.sender === user.id 
                                  ? 'bg-purple-700 hover:bg-purple-800' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              <span className="text-lg">📎</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">
                                  Attachment
                                </div>
                              </div>
                              <Download size={16} />
                            </a>
                          )}
                          <span className="text-xs opacity-70 block mt-1">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 p-4">
                    {selectedFile && (
                      <div className="mb-2 flex items-center gap-2 text-sm bg-purple-50 p-2 rounded">
                        <Paperclip size={16} className="text-purple-600" />
                        <span className="flex-1 truncate text-purple-900">{selectedFile.name}</span>
                        <span className="text-xs text-purple-600">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <label className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                        <Upload size={24} />
                        <input
                          type="file"
                          onChange={handleFileSelect}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx,.zip,.rar,.txt"
                        />
                      </label>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                      />
                      <button
                        type="submit"
                        disabled={uploading || (!newMessage.trim() && !selectedFile)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={18} />
                        {uploading ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      🔒 Messages are encrypted for your security
                      <span className="text-gray-400">• Max file size: 10MB</span>
                    </p>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Search size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>Select a conversation or search for users to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
