import { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callType, setCallType] = useState(null); // 'video' or 'audio'
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState(null); // 'calling', 'ringing', 'connected', 'ended'
  const [peerConnection, setPeerConnection] = useState(null);

  // Initialize call
  const initiateCall = useCallback((otherUserId, type = 'video') => {
    setActiveCall({
      otherUserId,
      callerId: user?._id || user?.id,
      type,
      timestamp: Date.now()
    });
    setCallType(type);
    setCallStatus('calling');
  }, [user]);

  // End call
  const endCall = useCallback(() => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    
    setActiveCall(null);
    setIncomingCall(null);
    setCallType(null);
    setCallStatus(null);
  }, [localStream, remoteStream, peerConnection]);

  // Accept incoming call
  const acceptCall = useCallback(() => {
    if (incomingCall) {
      setActiveCall(incomingCall);
      setCallStatus('connected');
      setIncomingCall(null);
    }
  }, [incomingCall]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  return (
    <CallContext.Provider value={{
      incomingCall,
      activeCall,
      callType,
      callStatus,
      localStream,
      remoteStream,
      peerConnection,
      setIncomingCall,
      setActiveCall,
      setCallType,
      setCallStatus,
      setLocalStream,
      setRemoteStream,
      setPeerConnection,
      initiateCall,
      endCall,
      acceptCall,
      rejectCall
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);

