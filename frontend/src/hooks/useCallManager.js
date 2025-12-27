import { useEffect, useCallback } from 'react';
import { useCall } from '../context/CallContext';
import { useAuth } from '../context/AuthContext';
import { createPeerConnection, getUserMedia } from '../utils/webrtc';

/**
 * Hook to manage WebRTC call connections and signaling
 */
export const useCallManager = () => {
  const {
    activeCall,
    incomingCall,
    setActiveCall,
    setIncomingCall,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    peerConnection,
    localStream,
    setCallStatus,
    setCallType,
    endCall
  } = useCall();
  const { user } = useAuth();

  // Setup WebRTC connection - defined as regular function to avoid circular dependency
  const setupWebRTC = async (callId, callType, isCaller) => {
    try {
      // Get user media
      const stream = await getUserMedia(true, callType === 'video');
      setLocalStream(stream);

      // Create peer connection
      const pc = createPeerConnection(
        async (candidate) => {
          // Send ICE candidate to server
          try {
            await fetch('/api/calls/ice-candidate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ callId, candidate })
            });
          } catch (error) {
            console.error('Error sending ICE candidate:', error);
          }
        },
        (stream) => {
          // Handle remote stream
          setRemoteStream(stream);
        }
      );

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      setPeerConnection(pc);
      setCallStatus('connected');
    } catch (error) {
      console.error('Error setting up WebRTC:', error);
      alert('Could not access camera/microphone: ' + error.message);
      endCall();
    }
  };

  // Poll for incoming calls
  useEffect(() => {
    if (!user) return;

    const checkIncomingCalls = async () => {
      try {
        const response = await fetch('/api/calls/incoming', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.calls && data.calls.length > 0) {
            const latestCall = data.calls[0];
            // Only set if we don't already have this call
            if (!incomingCall || incomingCall.callId !== latestCall.callId) {
              setIncomingCall({
                callId: latestCall.callId,
                callerId: latestCall.callerId,
                type: latestCall.callType,
                timestamp: latestCall.createdAt
              });
              setCallStatus('ringing');
            }
          }
        }
      } catch (error) {
        // Silently handle errors
      }
    };

    const interval = setInterval(checkIncomingCalls, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [user, incomingCall, setIncomingCall, setCallStatus]);

  // Initiate call
  const startCall = useCallback(async (otherUserId, callType = 'video') => {
    try {
      const response = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ otherUserId, callType })
      });

      if (!response.ok) throw new Error('Failed to initiate call');

      const data = await response.json();
      setActiveCall({
        callId: data.callId,
        otherUserId,
        type: callType,
        timestamp: Date.now()
      });
      setCallType(callType);
      setCallStatus('calling');

      // Setup WebRTC after a short delay to allow UI to update
      setTimeout(() => {
        setupWebRTC(data.callId, callType, true);
      }, 500);
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Failed to start call: ' + error.message);
      endCall();
    }
  }, [setActiveCall, setCallStatus, setCallType, endCall]);

  // Accept call
  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      const response = await fetch('/api/calls/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ callId: incomingCall.callId })
      });

      if (!response.ok) throw new Error('Failed to accept call');

      const callData = {
        callId: incomingCall.callId,
        otherUserId: incomingCall.callerId,
        type: incomingCall.type,
        timestamp: incomingCall.timestamp
      };
      
      setActiveCall(callData);
      setCallType(incomingCall.type);
      setCallStatus('connected');
      setIncomingCall(null);

      // Setup WebRTC after a short delay to allow UI to update
      setTimeout(() => {
        setupWebRTC(incomingCall.callId, incomingCall.type, false);
      }, 500);
    } catch (error) {
      console.error('Error accepting call:', error);
      alert('Failed to accept call: ' + error.message);
      endCall();
    }
  }, [incomingCall, setActiveCall, setCallStatus, setCallType, setIncomingCall, endCall]);

  // End call
  const hangUp = useCallback(async () => {
    if (activeCall?.callId) {
      try {
        await fetch('/api/calls/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ callId: activeCall.callId })
        });
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
    endCall();
  }, [activeCall, endCall]);

  // Reject call
  const rejectIncomingCall = useCallback(async () => {
    if (incomingCall?.callId) {
      try {
        await fetch('/api/calls/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ callId: incomingCall.callId })
        });
      } catch (error) {
        console.error('Error rejecting call:', error);
      }
    }
    endCall();
  }, [incomingCall, endCall]);

  return {
    startCall,
    acceptIncomingCall,
    rejectIncomingCall,
    hangUp
  };
};

