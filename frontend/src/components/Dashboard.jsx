import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserSearch } from './UserSearch';
import { Friends } from './Friends';
import { OnlineUsers } from './OnlineUsers';

export const Dashboard = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations', 'friends', 'online', or 'rooms'
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      setRooms(data.rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Welcome Section */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome back, {user?.username}!</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Here's what's happening with your chats</p>
            </div>
            {/* Responsive Tab Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base rounded-lg transition-colors ${
                  activeTab === 'conversations' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Messages
              </button>
              <button
                onClick={() => setActiveTab('online')}
                className={`px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base rounded-lg transition-colors ${
                  activeTab === 'online' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Online
              </button>
              <button
                onClick={() => setActiveTab('friends')}
                className={`px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base rounded-lg transition-colors ${
                  activeTab === 'friends' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Friends
              </button>
              <button
                onClick={() => setActiveTab('rooms')}
                className={`px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base rounded-lg transition-colors ${
                  activeTab === 'rooms' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Rooms
              </button>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'conversations' && <UserSearch />}
        {activeTab === 'online' && <OnlineUsers />}
        {activeTab === 'friends' && <Friends />}
        {activeTab === 'rooms' && (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Chat Rooms</h2>
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <div
                    key={room._id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer gap-2"
                    onClick={() => navigate(`/chat/room/${room._id}`)}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                        {room.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 truncate">{room.name}</h4>
                        <p className="text-sm text-gray-500 truncate">{room.description}</p>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
                      {room.participants?.length || 0} members
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
