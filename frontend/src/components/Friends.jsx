import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCallManager } from '../hooks/useCallManager';

export const Friends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startCall } = useCallManager();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'sent'

  useEffect(() => {
    fetchFriendsData();
  }, []);

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
    } finally {
      setLoading(false);
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
      
      await fetchFriendsData(); // Refresh data
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert(error.message);
    }
  };

  const acceptFriendRequest = async (userId) => {
    try {
      const response = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to accept friend request');
      }
      
      const data = await response.json();
      await fetchFriendsData(); // Refresh data
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert(error.message || 'Failed to accept friend request. Please try again.');
    }
  };

  const declineFriendRequest = async (userId) => {
    try {
      const response = await fetch('/api/friends/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });

      if (!response.ok) throw new Error('Failed to decline friend request');
      
      await fetchFriendsData(); // Refresh data
    } catch (error) {
      console.error('Error declining friend request:', error);
      alert(error.message);
    }
  };

  const removeFriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;

    try {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to remove friend');
      
      await fetchFriendsData(); // Refresh data
    } catch (error) {
      console.error('Error removing friend:', error);
      alert(error.message);
    }
  };

  const cancelFriendRequest = async (userId) => {
    try {
      const response = await fetch(`/api/friends/request/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to cancel friend request');
      
      await fetchFriendsData(); // Refresh data
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      alert(error.message);
    }
  };

  const startChat = async (friendId) => {
    try {
      // Get current user ID - handle both id and _id formats
      const currentUserId = user?.id || user?._id;
      
      if (!currentUserId) {
        alert('You must be logged in to start a conversation');
        return;
      }

      if (!friendId) {
        alert('Invalid friend selected');
        return;
      }

      // Ensure both IDs are strings
      const participants = [
        currentUserId.toString(), 
        friendId.toString()
      ];

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          participants,
          isGroup: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start conversation');
      }

      const data = await response.json();
      
      if (data.conversation && data.conversation._id) {
        navigate(`/chat/conversation/${data.conversation._id}`);
      } else {
        throw new Error('Invalid conversation data received');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert(error.message || 'Failed to start conversation. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Friends</h2>
      
      {/* Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === 'friends'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Requests ({friendRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === 'sent'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sent ({sentRequests.length})
        </button>
      </div>

      {/* Friends List */}
      {activeTab === 'friends' && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No friends yet</p>
          ) : (
            friends.map((friend) => (
              <div key={friend._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 hover:bg-gray-50 rounded-lg gap-3">
                <div className="flex items-center w-full sm:w-auto min-w-0">
                  <img
                    src={friend.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username || 'User')}&background=random&color=fff&size=40`}
                    alt={friend.username}
                    className="h-10 w-10 rounded-full flex-shrink-0"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username || 'User')}&background=random&color=fff&size=40`;
                    }}
                  />
                  <div className="ml-3 min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 truncate">{friend.username}</h4>
                    <p className="text-sm text-gray-500">
                      {friend.status === 'online' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => startChat(friend._id)}
                    className="flex-1 sm:flex-none px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                    title="Start chat"
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => startCall(friend._id, 'video')}
                    className="flex-1 sm:flex-none px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    title="Video call"
                  >
                    📹
                  </button>
                  <button
                    onClick={() => startCall(friend._id, 'audio')}
                    className="flex-1 sm:flex-none px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors"
                    title="Audio call"
                  >
                    📞
                  </button>
                  <button
                    onClick={() => removeFriend(friend._id)}
                    className="flex-1 sm:flex-none px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                    title="Remove friend"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Friend Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-3">
          {friendRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending requests</p>
          ) : (
            friendRequests.map((request) => (
              <div key={request._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <img
                    src={request.from?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.from?.username || 'User')}&background=random&color=fff&size=40`}
                    alt={request.from?.username}
                    className="h-10 w-10 rounded-full"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.from?.username || 'User')}&background=random&color=fff&size=40`;
                    }}
                  />
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">{request.from?.username || 'Unknown User'}</h4>
                    <p className="text-sm text-gray-500">Wants to be friends</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => acceptFriendRequest(request.from?._id || request.from)}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineFriendRequest(request.from?._id || request.from)}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sent Requests */}
      {activeTab === 'sent' && (
        <div className="space-y-3">
          {sentRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sent requests</p>
          ) : (
            sentRequests.map((request) => (
              <div key={request._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <img
                    src={request.to?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.to?.username || 'User')}&background=random&color=fff&size=40`}
                    alt={request.to?.username}
                    className="h-10 w-10 rounded-full"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.to?.username || 'User')}&background=random&color=fff&size=40`;
                    }}
                  />
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">{request.to?.username || 'Unknown User'}</h4>
                    <p className="text-sm text-gray-500">Request sent</p>
                  </div>
                </div>
                <button
                  onClick={() => cancelFriendRequest(request.to?._id || request.to)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
