import { useState, useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';
import { useAuth } from '../context/AuthContext';
import { useCallManager } from '../hooks/useCallManager';
import { getUserMedia } from '../utils/webrtc';

export const Call = () => {
  const { 
    activeCall, 
    incomingCall, 
    callType,
    callStatus,
    localStream,
    remoteStream,
    setLocalStream,
    setRemoteStream
  } = useCall();
  const { acceptIncomingCall, rejectIncomingCall, hangUp } = useCallManager();
  const { user } = useAuth();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch other user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (activeCall || incomingCall) {
        const userId = activeCall?.otherUserId || incomingCall?.callerId;
        try {
          const response = await fetch(`/api/users/${userId}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            setOtherUser(data.user);
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchUserInfo();
  }, [activeCall, incomingCall]);

  // Setup local video stream
  useEffect(() => {
    if (activeCall && callStatus === 'connected') {
      const setupLocalStream = async () => {
        try {
          const stream = await getUserMedia(
            true, // audio
            callType === 'video' // video
          );
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (error) {
          alert('Could not access camera/microphone: ' + error.message);
          hangUp();
        }
      };
      setupLocalStream();
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeCall, callStatus, callType, hangUp]);

  // Setup remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle mute/unmute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = muted;
      });
      setMuted(!muted);
    }
  };

  // Handle video on/off
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  if (!activeCall && !incomingCall) {
    return null;
  }

  // Incoming call UI
  if (incomingCall && !activeCall) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            {isLoading ? (
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl text-white font-bold">
                      {otherUser?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {callType === 'video' ? '📹 Video Call' : '📞 Audio Call'}
                  </h2>
                  <p className="text-gray-600">
                    {otherUser?.username || 'Unknown'} is calling you
                  </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={rejectIncomingCall}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 transition-colors"
                    aria-label="Reject call"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    onClick={acceptIncomingCall}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 transition-colors"
                    aria-label="Accept call"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active call UI
  if (activeCall && callStatus === 'connected') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Remote video */}
        <div className="flex-1 relative">
          {callType === 'video' ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl text-white font-bold">
                    {otherUser?.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{otherUser?.username || 'User'}</h3>
                <p className="text-gray-400">Audio Call</p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture for video calls) */}
        {callType === 'video' && (
          <div className="absolute top-4 right-4 w-32 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Call controls */}
        <div className="bg-black bg-opacity-50 p-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`rounded-full p-4 transition-colors ${
                muted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              } text-white`}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {muted ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                )}
              </svg>
            </button>

            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`rounded-full p-4 transition-colors ${
                  videoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
                } text-white`}
                aria-label={videoEnabled ? 'Turn off video' : 'Turn on video'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}

          <button
            onClick={hangUp}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 transition-colors"
            aria-label="End call"
          >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </button>
          </div>
          <p className="text-white text-center mt-4 text-sm">
            {otherUser?.username || 'User'}
          </p>
        </div>
      </div>
    );
  }

  // Calling/Ringing UI
  if (activeCall && (callStatus === 'calling' || callStatus === 'ringing')) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-5xl text-white font-bold">
              {otherUser?.username?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {callType === 'video' ? '📹 Calling...' : '📞 Calling...'}
          </h2>
          <p className="text-gray-300 mb-6">{otherUser?.username || 'User'}</p>
          <button
            onClick={hangUp}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 transition-colors"
            aria-label="Cancel call"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return null;
};

