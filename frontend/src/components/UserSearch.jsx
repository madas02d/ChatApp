import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const UserSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    fetchConversations();
    fetchFriendsData();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchFriendsData = async () => {
    try {
      const response = await fetch('/api/friends', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch friends data');
      const data = await response.json();
      setFriends(data.friends || []);
      setFriendRequests(data.friendRequests || []);
      setSentRequests(data.sentFriendRequests || []);
    } catch (error) {
      console.error('Error fetching friends data:', error);
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to search users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (otherUser) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          participants: [user._id, otherUser._id],
          isGroup: false
        })
      });

      if (!response.ok) throw new Error('Failed to start conversation');
      const data = await response.json();
      navigate(`/chat/conversation/${data.conversation._id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });

      if (!response.ok) throw new Error('Failed to send friend request');
      
      await fetchFriendsData(); // Refresh friends data
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert(error.message);
    }
  };

  const openConversation = (conversationId) => {
    navigate(`/chat/conversation/${conversationId}`);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const getUserRelationship = (userId) => {
    const friendIds = friends.map(f => f._id);
    const requestFromIds = friendRequests.map(r => r.from._id);
    const sentToIds = sentRequests.map(r => r.to._id);

    if (friendIds.includes(userId)) return 'friend';
    if (requestFromIds.includes(userId)) return 'request_received';
    if (sentToIds.includes(userId)) return 'request_sent';
    return 'none';
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Start a New Chat</h2>
      
      {/* Search Input */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search for users to chat with..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <svg
          className="w-5 h-5 text-gray-400 absolute left-3 top-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Search Results</h3>
          {loading ? (
            <div className="flex justify-center items-center h-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {users
                .filter(u => u._id !== user._id) // Don't show current user
                .map((user) => {
                  const relationship = getUserRelationship(user._id);
                  return (
                    <div
                      key={user._id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 hover:bg-gray-50 rounded-lg gap-3"
                    >
                      <div className="flex items-center w-full sm:w-auto min-w-0 flex-1">
                        <img
                          src={user.photoURL || 'https://via.placeholder.com/40'}
                          alt={user.username}
                          className="h-10 w-10 rounded-full flex-shrink-0"
                        />
                        <div className="ml-3 min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 truncate">{user.username}</h4>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        {relationship === 'friend' ? (
                          <>
                            <button
                              onClick={() => startConversation(user)}
                              className="flex-1 sm:flex-none px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                            >
                              Chat
                            </button>
                          </>
                        ) : relationship === 'request_received' ? (
                          <span className="flex-1 sm:flex-none px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded text-center">
                            Request Received
                          </span>
                        ) : relationship === 'request_sent' ? (
                          <span className="flex-1 sm:flex-none px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded text-center">
                            Request Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => sendFriendRequest(user._id)}
                            className="flex-1 sm:flex-none px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                          >
                            Add Friend
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              {users.length === 0 && !loading && (
                <p className="text-gray-500 text-center py-4">No users found</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Conversations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Conversations</h3>
        <div className="space-y-2">
          {conversations.map((conversation) => {
            // Current user ID can be stored as `id` or `_id`; always compare as strings
            const currentUserId = (user?._id || user?.id || '').toString();
            const otherParticipant = conversation.participants.find(
              (p) => p?._id?.toString() !== currentUserId
            );

            // unreadCount comes from a Mongoose Map, which serializes as a plain object
            const unreadCountMap = conversation.unreadCount || {};
            const unreadCount = unreadCountMap[currentUserId] || 0;

            return (
              <div
                key={conversation._id}
                className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors gap-3"
                onClick={() => openConversation(conversation._id)}
              >
                <img
                  src={otherParticipant?.photoURL || 'https://via.placeholder.com/40'}
                  alt={otherParticipant?.username}
                  className="h-10 w-10 rounded-full flex-shrink-0"
                />
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">{otherParticipant?.username}</h4>
                    <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
                      {conversation.lastMessage
                        ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString()
                        : 'No messages'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                    {unreadCount}
                  </span>
                )}
              </div>
            );
          })}
          {conversations.length === 0 && (
            <p className="text-gray-500 text-center py-4">No conversations yet</p>
          )}
        </div>
      </div>
    </div>
  );
};
