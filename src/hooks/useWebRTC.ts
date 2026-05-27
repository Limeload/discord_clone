import { useEffect, useRef, useState, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface PeerState {
  userId: string;
  stream: MediaStream | null;
  connection: RTCPeerConnection;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC(
  channelId: Id<'channels'> | null,
  clerkId: string,
  currentUserId: Id<'users'> | null
) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, PeerState>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const peersRef = useRef<Map<string, PeerState>>(new Map());

  const sendSignal = useMutation(api.signals.send);
  const markProcessed = useMutation(api.signals.markProcessed);
  const joinVoice = useMutation(api.signals.joinVoice);
  const leaveVoice = useMutation(api.signals.leaveVoice);
  const updateVoiceState = useMutation(api.signals.updateVoiceState);

  const incomingSignals = useQuery(
    api.signals.receive,
    channelId && clerkId ? { channelId, clerkId } : 'skip'
  );

  const voiceParticipants = useQuery(
    api.signals.getVoiceParticipants,
    channelId ? { channelId } : 'skip'
  );

  const createPeerConnection = useCallback(
    (remoteUserId: string, remoteConvexId: Id<'users'>) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (e) => {
        if (e.candidate && channelId && clerkId) {
          sendSignal({
            toUserId: remoteConvexId,
            channelId,
            type: 'ice-candidate',
            payload: JSON.stringify(e.candidate),
            clerkId,
          });
        }
      };

      pc.ontrack = (e) => {
        setPeers((prev) => {
          const next = new Map(prev);
          const existing = next.get(remoteUserId);
          if (existing) {
            next.set(remoteUserId, { ...existing, stream: e.streams[0] });
          }
          return next;
        });
      };

      if (localStream) {
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
      }

      return pc;
    },
    [channelId, clerkId, localStream, sendSignal]
  );

  // Process incoming signals
  useEffect(() => {
    if (!incomingSignals || !channelId || !clerkId || !currentUserId) return;

    incomingSignals.forEach(async (signal) => {
      if (signal.processed) return;

      const fromId = signal.fromUserId as string;
      let peerState = peersRef.current.get(fromId);

      if (!peerState) {
        const pc = createPeerConnection(fromId, signal.fromUserId as Id<'users'>);
        peerState = { userId: fromId, stream: null, connection: pc };
        peersRef.current.set(fromId, peerState);
        setPeers(new Map(peersRef.current));
      }

      const pc = peerState.connection;

      if (signal.type === 'offer') {
        await pc.setRemoteDescription(JSON.parse(signal.payload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal({
          toUserId: signal.fromUserId as Id<'users'>,
          channelId,
          type: 'answer',
          payload: JSON.stringify(answer),
          clerkId,
        });
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(JSON.parse(signal.payload));
      } else if (signal.type === 'ice-candidate') {
        try {
          await pc.addIceCandidate(JSON.parse(signal.payload));
        } catch {}
      }

      await markProcessed({ signalId: signal._id });
    });
  }, [incomingSignals, channelId, clerkId, currentUserId, createPeerConnection, sendSignal, markProcessed]);

  const join = useCallback(
    async (withVideo = false) => {
      if (!channelId || !clerkId) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo,
      });
      setLocalStream(stream);
      setIsCameraOn(withVideo);

      await joinVoice({ channelId, clerkId });

      // Initiate offers to all existing participants
      if (voiceParticipants && currentUserId) {
        for (const p of voiceParticipants) {
          if (p.userId === currentUserId) continue;
          const pc = createPeerConnection(p.userId as string, p.userId as Id<'users'>);
          const peerState: PeerState = { userId: p.userId as string, stream: null, connection: pc };
          peersRef.current.set(p.userId as string, peerState);

          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sendSignal({
            toUserId: p.userId as Id<'users'>,
            channelId,
            type: 'offer',
            payload: JSON.stringify(offer),
            clerkId,
          });
        }
        setPeers(new Map(peersRef.current));
      }
    },
    [channelId, clerkId, currentUserId, voiceParticipants, createPeerConnection, joinVoice, sendSignal]
  );

  const leave = useCallback(async () => {
    if (!channelId || !clerkId) return;

    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);

    peersRef.current.forEach(({ connection }) => connection.close());
    peersRef.current.clear();
    setPeers(new Map());

    await leaveVoice({ channelId, clerkId });
  }, [channelId, clerkId, localStream, leaveVoice]);

  const toggleMute = useCallback(async () => {
    if (!localStream || !channelId || !clerkId) return;
    const newMuted = !isMuted;
    localStream.getAudioTracks().forEach((t) => (t.enabled = !newMuted));
    setIsMuted(newMuted);
    await updateVoiceState({ channelId, clerkId, muted: newMuted });
  }, [localStream, isMuted, channelId, clerkId, updateVoiceState]);

  const toggleCamera = useCallback(async () => {
    if (!localStream || !channelId || !clerkId) return;
    const newCameraOn = !isCameraOn;
    localStream.getVideoTracks().forEach((t) => (t.enabled = newCameraOn));
    setIsCameraOn(newCameraOn);
    await updateVoiceState({ channelId, clerkId, cameraOn: newCameraOn });
  }, [localStream, isCameraOn, channelId, clerkId, updateVoiceState]);

  const toggleDeafen = useCallback(async () => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    peers.forEach(({ stream }) => {
      stream?.getAudioTracks().forEach((t) => (t.enabled = !newDeafened));
    });
    if (channelId && clerkId) {
      await updateVoiceState({ channelId, clerkId, deafened: newDeafened });
    }
  }, [isDeafened, peers, channelId, clerkId, updateVoiceState]);

  return {
    localStream,
    peers,
    isMuted,
    isCameraOn,
    isDeafened,
    voiceParticipants: voiceParticipants ?? [],
    join,
    leave,
    toggleMute,
    toggleCamera,
    toggleDeafen,
  };
}
