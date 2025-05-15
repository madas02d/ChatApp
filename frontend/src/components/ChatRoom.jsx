import { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

export const ChatRoom = () => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { currentRoom, messages, activeUsers, sendMessage } = useChat();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Active Users Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Active Users</h2>
        </div>
        <div className="p-4">
          {activeUsers.map(user => (
            <div key={user._id} className="flex items-center space-x-2 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{user.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map(msg => (
            <div
              key={msg._id}
              className={`mb-4 ${
                msg.sender._id === user._id ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  msg.sender._id === user._id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white'
                }`}
              >
                <div className="font-semibold">{msg.sender.username}</div>
                <div>{msg.content}</div>
                <div className="text-xs opacity-75">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
          <div className="flex space-x-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Type a message..."
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 