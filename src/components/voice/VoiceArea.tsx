import { useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Headphones,
  HeadphoneOff,
  PhoneOff,
  Monitor,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useWebRTC } from '../../hooks/useWebRTC';
import { VideoTile } from './VideoTile';
import { cn } from '../../lib/utils';

interface VoiceAreaProps {
  channelId: Id<'channels'>;
  onLeave: () => void;
}

function ControlButton({
  onClick,
  active,
  danger,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
        danger
          ? 'bg-discord-red hover:bg-red-700 text-white'
          : active
          ? 'bg-discord-hover text-white hover:bg-discord-input'
          : 'bg-discord-input text-discord-muted hover:bg-discord-hover hover:text-white'
      )}
    >
      {children}
    </button>
  );
}

export function VoiceArea({ channelId, onLeave }: VoiceAreaProps) {
  const { clerkUser, convexUser } = useCurrentUser();
  const channel = useQuery(api.channels.getById, { channelId });

  const {
    localStream,
    peers,
    isMuted,
    isCameraOn,
    isDeafened,
    isScreenSharing,
    mediaError,
    clearMediaError,
    voiceParticipants,
    join,
    leave,
    toggleMute,
    toggleCamera,
    toggleDeafen,
    toggleScreenShare,
  } = useWebRTC(channelId, clerkUser?.id ?? '', convexUser?._id ?? null);

  useEffect(() => {
    join(false);
    return () => {
      leave();
    };
  }, [channelId]);

  async function handleLeave() {
    await leave();
    onLeave();
  }

  const peerArray = Array.from(peers.values());

  return (
    <div className="flex-1 flex flex-col bg-discord-bg min-h-0">
      {/* Header */}
      <div className="h-12 flex items-center px-4 border-b border-black/30 shadow-sm gap-2 shrink-0">
        <div className="w-4 h-4 rounded-sm bg-discord-green flex items-center justify-center mr-1">
          <span className="text-white text-xs font-bold">🔊</span>
        </div>
        <span className="font-semibold text-white">{channel?.name}</span>
        <span className="text-discord-muted text-sm ml-1">Voice Connected</span>
        <span className="ml-2 w-2 h-2 rounded-full bg-discord-green animate-pulse" />
      </div>

      {/* Media access error banner */}
      {mediaError && (
        <div className="mx-4 mt-3 flex items-start gap-3 bg-red-900/40 border border-red-700/60 rounded-lg px-4 py-3">
          <span className="text-red-400 text-lg shrink-0">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-300">{mediaError}</p>
          </div>
          <button
            onClick={clearMediaError}
            className="text-red-400 hover:text-red-200 shrink-0 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Video grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {peerArray.length === 0 && !localStream ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-discord-muted">
            {mediaError ? (
              <>
                <div className="text-5xl">🎙️</div>
                <p className="text-lg font-semibold text-discord-text">Unable to join voice</p>
                <button
                  onClick={() => { clearMediaError(); join(false); }}
                  className="text-sm text-discord-link hover:underline"
                >
                  Try again
                </button>
              </>
            ) : (
              <>
                <div className="text-5xl">🎙️</div>
                <p className="text-lg font-semibold text-discord-text">
                  You're the only one here
                </p>
                <p className="text-sm">Waiting for others to join...</p>
              </>
            )}
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-3',
              peerArray.length === 0
                ? 'grid-cols-1 max-w-md mx-auto'
                : peerArray.length <= 1
                ? 'grid-cols-2'
                : peerArray.length <= 3
                ? 'grid-cols-2'
                : 'grid-cols-3'
            )}
          >
            {/* Local tile */}
            {localStream && (
              <VideoTile
                stream={localStream}
                name={convexUser?.name ?? clerkUser?.fullName ?? 'You'}
                imageUrl={convexUser?.imageUrl ?? clerkUser?.imageUrl}
                isMuted={isMuted}
                isCameraOn={isCameraOn}
                isLocal={true}
              />
            )}

            {/* Remote peer tiles */}
            {peerArray.map((peer) => {
              const participant = voiceParticipants.find(
                (p) => p.userId === peer.userId
              );
              return (
                <VideoTile
                  key={peer.userId}
                  stream={peer.stream}
                  name={participant?.user?.name ?? 'Participant'}
                  imageUrl={participant?.user?.imageUrl}
                  isMuted={participant?.muted}
                  isCameraOn={participant?.cameraOn}
                />
              );
            })}
          </div>
        )}

        {/* Participants list (audio-only) */}
        {voiceParticipants.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-discord-muted uppercase mb-2 px-1">
              In Voice — {voiceParticipants.length}
            </p>
            <div className="flex flex-wrap gap-3">
              {voiceParticipants.map((p) =>
                p.user ? (
                  <div
                    key={p._id}
                    className="flex items-center gap-2 bg-discord-sidebar rounded-lg px-3 py-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-discord-input flex items-center justify-center text-xs font-bold text-white">
                      {p.user.name[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-discord-text">{p.user.name}</span>
                    {p.muted && <MicOff size={12} className="text-discord-red" />}
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="h-24 bg-discord-channel-bg flex items-center justify-center gap-4 border-t border-black/20">
        <ControlButton onClick={toggleMute} active={isMuted} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </ControlButton>

        <ControlButton
          onClick={toggleCamera}
          active={!isCameraOn}
          title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
        </ControlButton>

        <ControlButton
          onClick={toggleDeafen}
          active={isDeafened}
          title={isDeafened ? 'Undeafen' : 'Deafen'}
        >
          {isDeafened ? <HeadphoneOff size={20} /> : <Headphones size={20} />}
        </ControlButton>

        <ControlButton onClick={toggleScreenShare} active={isScreenSharing} title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
          <Monitor size={20} />
        </ControlButton>

        <ControlButton onClick={handleLeave} danger title="Leave voice">
          <PhoneOff size={20} />
        </ControlButton>
      </div>
    </div>
  );
}
