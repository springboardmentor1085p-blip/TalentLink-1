// frontend/src/components/ChatWindow.jsx
import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { messagesAPI } from '../api/messages';

export default function ChatWindow({ user, recipientId, recipientName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (recipientId) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [recipientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = () => {
    messagesAPI.getWithUser(recipientId).then((res) => setMessages(res.data));
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    messagesAPI
      .send({
        recipient: recipientId,
        content: newMessage,
      })
      .then(() => {
        setNewMessage('');
        loadMessages();
      });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 p-4">
        <h3 className="font-semibold text-lg">{recipientName}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === user.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.sender === user.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <p>{msg.content}</p>
              <span className="text-xs opacity-70">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}