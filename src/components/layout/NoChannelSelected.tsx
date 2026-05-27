import { Hash } from 'lucide-react';

interface NoChannelSelectedProps {
  serverName: string;
}

export function NoChannelSelected({ serverName }: NoChannelSelectedProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-discord-bg gap-4 text-center p-8">
      <div className="w-16 h-16 rounded-full bg-discord-sidebar flex items-center justify-center">
        <Hash size={32} className="text-discord-muted" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{serverName}</h2>
        <p className="text-discord-muted">
          Select a channel from the sidebar to start chatting.
        </p>
      </div>
    </div>
  );
}
