import { useQuery } from 'convex/react';
import { Hash, UserPlus, Bell, Pin, Search, HelpCircle } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';

interface ChatAreaProps {
  channelId: Id<'channels'>;
}

export function ChatArea({ channelId }: ChatAreaProps) {
  const channel = useQuery(api.channels.getById, { channelId });

  if (!channel) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-discord-bg">
      {/* Channel header */}
      <div className="h-12 flex items-center px-4 border-b border-black/30 shadow-sm gap-2 shrink-0">
        <Hash size={20} className="text-discord-muted shrink-0" />
        <span className="font-semibold text-white">{channel.name}</span>
        <div className="ml-auto flex items-center gap-2">
          <button className="p-1.5 text-discord-muted hover:text-discord-text transition-colors">
            <Bell size={20} />
          </button>
          <button className="p-1.5 text-discord-muted hover:text-discord-text transition-colors">
            <Pin size={20} />
          </button>
          <button className="p-1.5 text-discord-muted hover:text-discord-text transition-colors">
            <UserPlus size={20} />
          </button>
          <div className="bg-discord-input rounded flex items-center px-2 py-1 gap-2">
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent text-sm text-discord-text placeholder-discord-muted outline-none w-28"
            />
            <Search size={14} className="text-discord-muted" />
          </div>
          <button className="p-1.5 text-discord-muted hover:text-discord-text transition-colors">
            <HelpCircle size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList channelId={channelId} channelName={channel.name} />
      <TypingIndicator channelId={channelId} />
      <MessageInput channelId={channelId} channelName={channel.name} />
    </div>
  );
}
