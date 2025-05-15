import { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);

  const joinRoom = async (roomId) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to join room');
      
      const data = await response.json();
      setCurrentRoom(data.room);
      setMessages(data.messages || []);
      setActiveUsers(data.activeUsers || []);
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  };

  const sendMessage = async (content) => {
    if (!currentRoom) return;
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roomId: currentRoom._id,
          content
        })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  return (
    <ChatContext.Provider value={{
      currentRoom,
      messages,
      activeUsers,
      joinRoom,
      sendMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext); 