import { useEffect, useRef } from 'react';
import { MicOff, VideoOff, Loader2, WifiOff } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';
import type { PeerStatus } from '../../hooks/useWebRTC';

interface VideoTileProps {
  stream: MediaStream | null;
  name: string;
  imageUrl?: string | null;
  isMuted?: boolean;
  isCameraOn?: boolean;
  isLocal?: boolean;
  connectionState?: PeerStatus;
}

export function VideoTile({
  stream,
  name,
  imageUrl,
  isMuted,
  isCameraOn,
  isLocal,
  connectionState,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-[#1e1f22] rounded-lg overflow-hidden aspect-video flex items-center justify-center">
      {isCameraOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          className={cn('w-full h-full object-cover', isLocal && 'scale-x-[-1]')}
        />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Avatar name={name} imageUrl={imageUrl} size="lg" />
          <VideoOff size={20} className="text-discord-muted absolute top-2 right-2" />
        </div>
      )}

      {/* Connection state overlay */}
      {connectionState && connectionState !== 'connected' && (
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/60',
            connectionState === 'failed' && 'bg-red-950/70'
          )}
        >
          {connectionState === 'connecting' && (
            <>
              <Loader2 size={24} className="text-discord-muted animate-spin" />
              <span className="text-xs text-discord-muted">Connecting…</span>
            </>
          )}
          {connectionState === 'degraded' && (
            <>
              <WifiOff size={24} className="text-yellow-400" />
              <span className="text-xs text-yellow-400">Reconnecting…</span>
            </>
          )}
          {connectionState === 'failed' && (
            <>
              <WifiOff size={24} className="text-red-400" />
              <span className="text-xs text-red-400">Connection failed</span>
            </>
          )}
        </div>
      )}

      {/* Name tag */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-center gap-1">
        {isMuted && <MicOff size={12} className="text-discord-red" />}
        <span className="text-white text-xs font-semibold truncate">
          {isLocal ? `${name} (you)` : name}
        </span>
      </div>
    </div>
  );
}
