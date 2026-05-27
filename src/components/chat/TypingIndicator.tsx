import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useCurrentUser } from '../../hooks/useCurrentUser';

interface TypingIndicatorProps {
  channelId: Id<'channels'>;
}

export function TypingIndicator({ channelId }: TypingIndicatorProps) {
  const { clerkUser } = useCurrentUser();
  const typingUsers = useQuery(
    api.messages.getTyping,
    clerkUser ? { channelId, currentClerkId: clerkUser.id } : 'skip'
  );

  if (!typingUsers || typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u?.name ?? 'Someone');
  let text: string;
  if (names.length === 1) text = `${names[0]} is typing...`;
  else if (names.length === 2) text = `${names[0]} and ${names[1]} are typing...`;
  else text = 'Several people are typing...';

  return (
    <div className="px-4 pb-1 h-5 flex items-center gap-1">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 bg-discord-muted rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-discord-muted">
        <strong className="text-discord-text">{text.split(' is typing')[0].split(' are typing')[0]}</strong>
        {text.includes('is typing') ? ' is typing...' : ' are typing...'}
      </span>
    </div>
  );
}
