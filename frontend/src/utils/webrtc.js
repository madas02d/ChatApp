/**
 * WebRTC utilities for peer-to-peer calling
 */

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

/**
 * Create a new RTCPeerConnection
 */
export function createPeerConnection(onIceCandidate, onTrack) {
  const pc = new RTCPeerConnection(iceServers);

  pc.onicecandidate = (event) => {
    if (event.candidate && onIceCandidate) {
      onIceCandidate(event.candidate);
    }
  };

  pc.ontrack = (event) => {
    if (onTrack && event.streams[0]) {
      onTrack(event.streams[0]);
    }
  };

  return pc;
}

/**
 * Get user media (video and/or audio)
 */
export async function getUserMedia(audio = true, video = true) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio,
      video: video ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      } : false
    });
    return stream;
  } catch (error) {
    console.error('Error getting user media:', error);
    throw new Error('Could not access camera/microphone. Please check permissions.');
  }
}

/**
 * Create offer for WebRTC connection
 */
export async function createOffer(pc) {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

/**
 * Create answer for WebRTC connection
 */
export async function createAnswer(pc, offer) {
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

/**
 * Set remote description and add ice candidate
 */
export async function handleRemoteDescription(pc, description) {
  await pc.setRemoteDescription(new RTCSessionDescription(description));
}

/**
 * Add ICE candidate
 */
export async function addIceCandidate(pc, candidate) {
  if (candidate && pc.remoteDescription) {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }
}

