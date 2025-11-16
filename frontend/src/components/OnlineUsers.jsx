import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const OnlineUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'friends', 'strangers'

  useEffect(() => {
    fetchOnlineUsers();
    fetchFriendsData();
    
    // Refresh online users every 10 seconds for more real-time updates
    const interval = setInterval(fetchOnlineUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch('/api/users/online', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch online users');
      const data = await response.json();
      setOnlineUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching online users:', error);
    } finally {
      setLoading(false);
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

  const startConversation = async (otherUser) => {
    try {
      console.log('Starting conversation with:', otherUser);
      console.log('Current user:', user);
      console.log('User ID (id):', user?.id);
      console.log('User ID (_id):', user?._id);
      console.log('Other user ID:', otherUser._id);
      
      // Use the correct property - try both id and _id
      const currentUserId = user?.id || user?._id;
      
      if (!currentUserId) {
        throw new Error('User not authenticated - no user ID found');
      }
      
      if (!otherUser?._id) {
        throw new Error('Invalid user selected');
      }
      
      const currentUserIdString = currentUserId.toString();
      const otherUserIdString = otherUser._id.toString();
      
      const requestBody = {
        participants: [currentUserIdString, otherUserIdString],
        isGroup: false
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to start conversation: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Conversation created:', data);
      navigate(`/chat/conversation/${data.conversation._id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation: ' + error.message);
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
      alert('Friend request sent successfully!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert(error.message);
    }
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

  const getTimeAgo = (lastSeen) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getAvatarUrl = (photoURL) => {
    if (photoURL && photoURL !== 'https://via.placeholder.com/150') {
      return photoURL;
    }
    // Use a better fallback avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent('User')}&background=random&color=fff&size=40`;
  };

  const filteredUsers = onlineUsers.filter(onlineUser => {
    const relationship = getUserRelationship(onlineUser._id);
    if (filter === 'friends') return relationship === 'friend';
    if (filter === 'strangers') return relationship === 'none';
    return true; // 'all'
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Online Users</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-500">{onlineUsers.length} online</span>
          </div>
          <button
            onClick={fetchOnlineUsers}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({onlineUsers.length})
        </button>
        <button
          onClick={() => setFilter('friends')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'friends'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Friends ({onlineUsers.filter(u => getUserRelationship(u._id) === 'friend').length})
        </button>
        <button
          onClick={() => setFilter('strangers')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'strangers'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          New People ({onlineUsers.filter(u => getUserRelationship(u._id) === 'none').length})
        </button>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-gray-500 mt-4 text-lg">
            {filter === 'all' ? 'No users online right now' : 
             filter === 'friends' ? 'No friends online right now' : 
             'No new people online right now'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {filter === 'all' ? 'Users will appear here when they\'re active' :
             filter === 'friends' ? 'Your friends will appear here when they\'re online' :
             'Discover new people to chat with when they come online'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((onlineUser) => {
            const relationship = getUserRelationship(onlineUser._id);
            return (
              <div
                key={onlineUser._id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className="relative">
                    <img
                      src={getAvatarUrl(onlineUser.photoURL)}
                      alt={onlineUser.username}
                      className="h-12 w-12 rounded-full"
                    />
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium text-gray-900">{onlineUser.username}</h4>
                    <p className="text-sm text-gray-500">
                      Last seen {getTimeAgo(onlineUser.lastSeen)}
                    </p>
                    {onlineUser.email && (
                      <p className="text-xs text-gray-400">{onlineUser.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {relationship === 'friend' ? (
                    <button
                      onClick={() => startConversation(onlineUser)}
                      className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Start Chat</span>
                    </button>
                  ) : relationship === 'request_received' ? (
                    <div className="flex space-x-2">
                      <span className="px-3 py-2 bg-yellow-100 text-yellow-800 text-sm rounded-lg">
                        Request Received
                      </span>
                    </div>
                  ) : relationship === 'request_sent' ? (
                    <div className="flex space-x-2">
                      <span className="px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded-lg">
                        Request Sent
                      </span>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => sendFriendRequest(onlineUser._id)}
                        className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Add Friend</span>
                      </button>
                      <button
                        onClick={() => startConversation(onlineUser)}
                        className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Quick Chat</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
