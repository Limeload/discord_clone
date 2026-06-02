import { useEffect, useRef, useState } from 'react';
import { usePaginatedQuery, useQuery, useMutation } from 'convex/react';
import { Hash, Pencil, Trash2, Smile } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Avatar } from '../ui/Avatar';
import { formatDate, formatTime, cn } from '../../lib/utils';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

interface MessageListProps {
  channelId: Id<'channels'>;
  channelName: string;
}

function ReactionPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 -top-10 bg-discord-sidebar border border-black/20 rounded-lg flex shadow-lg z-20 p-1 gap-0.5">
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => { onPick(emoji); onClose(); }}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-discord-hover text-lg transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function MessageItem({
  message,
  prevMessage,
  reactions,
  onEdit,
  onDelete,
  onReact,
  currentUserId,
  currentClerkId,
}: {
  message: any;
  prevMessage: any;
  reactions: { emoji: string; count: number; userIds: string[] }[];
  onEdit: (id: Id<'messages'>, content: string) => void;
  onDelete: (id: Id<'messages'>) => void;
  onReact: (id: Id<'messages'>, emoji: string) => void;
  currentUserId: Id<'users'> | null | undefined;
  currentClerkId: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showPicker, setShowPicker] = useState(false);

  const sameAuthor =
    prevMessage &&
    prevMessage.authorId === message.authorId &&
    message._creationTime - prevMessage._creationTime < 5 * 60 * 1000;

  const isOwn = message.authorId === currentUserId;

  function handleEditSubmit() {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message._id, editContent.trim());
    }
    setEditing(false);
  }

  if (message.deleted) {
    return (
      <div className={cn('px-4 py-0.5', sameAuthor ? '' : 'mt-4')}>
        <p className="text-discord-muted text-sm italic ml-14">This message was deleted.</p>
      </div>
    );
  }

  return (
    <div
      className={cn('relative px-4 hover:bg-white/5 group', sameAuthor ? 'py-0.5' : 'py-2 mt-2')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowPicker(false); }}
    >
      {/* Action toolbar */}
      {hovered && !editing && (
        <div className="absolute right-4 -top-3 bg-discord-sidebar border border-black/20 rounded flex shadow-lg z-10">
          <div className="relative">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="p-1.5 hover:bg-discord-hover text-discord-muted hover:text-discord-text rounded-l transition-colors"
              title="Add reaction"
            >
              <Smile size={14} />
            </button>
            {showPicker && (
              <ReactionPicker
                onPick={(emoji) => onReact(message._id, emoji)}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>
          {isOwn && (
            <button
              onClick={() => { setEditing(true); setEditContent(message.content); }}
              className="p-1.5 hover:bg-discord-hover text-discord-muted hover:text-discord-text transition-colors"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
          )}
          <button
            onClick={() => onDelete(message._id)}
            className="p-1.5 hover:bg-discord-hover text-discord-muted hover:text-discord-red rounded-r transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div className="flex items-start gap-3">
        {sameAuthor ? (
          <div className="w-10 shrink-0 flex items-center justify-end">
            {hovered && (
              <span className="text-xs text-discord-muted">{formatTime(message._creationTime)}</span>
            )}
          </div>
        ) : (
          <div className="shrink-0">
            <Avatar name={message.author?.name ?? 'Unknown'} imageUrl={message.author?.imageUrl} size="md" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {!sameAuthor && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-semibold text-white text-sm hover:underline cursor-pointer">
                {message.author?.name ?? 'Unknown'}
              </span>
              <span className="text-xs text-discord-muted">{formatDate(message._creationTime)}</span>
            </div>
          )}

          {editing ? (
            <div className="mt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
                  if (e.key === 'Escape') setEditing(false);
                }}
                className="w-full bg-discord-input text-discord-text rounded px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-discord-link"
                rows={2}
                autoFocus
              />
              <div className="flex items-center gap-2 mt-1 text-xs text-discord-muted">
                <span>escape to</span>
                <button onClick={() => setEditing(false)} className="text-discord-link hover:underline">cancel</button>
                <span>• enter to</span>
                <button onClick={handleEditSubmit} className="text-discord-link hover:underline">save</button>
              </div>
            </div>
          ) : (
            <div>
              {message.fileUrl && (
                <div className="mb-1">
                  {message.fileType?.startsWith('image/') ? (
                    <img src={message.fileUrl} alt="attachment" className="max-w-sm max-h-64 rounded object-contain" />
                  ) : (
                    <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="text-discord-link hover:underline text-sm">
                      📎 {message.content}
                    </a>
                  )}
                </div>
              )}
              <p className="text-sm text-discord-text leading-relaxed whitespace-pre-wrap break-words">
                {message.fileUrl && message.fileType?.startsWith('image/') ? null : message.content}
                {message.editedAt && (
                  <span className="text-xs text-discord-muted ml-1">(edited)</span>
                )}
              </p>
            </div>
          )}

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {reactions.map((r) => {
                const reacted = r.userIds.includes(currentUserId ?? '');
                return (
                  <button
                    key={r.emoji}
                    onClick={() => onReact(message._id, r.emoji)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border transition-colors',
                      reacted
                        ? 'bg-discord-link/20 border-discord-link text-discord-link'
                        : 'bg-discord-input border-transparent text-discord-text hover:border-discord-muted'
                    )}
                  >
                    <span>{r.emoji}</span>
                    <span className="text-xs font-medium">{r.count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessageList({ channelId, channelName }: MessageListProps) {
  const { clerkUser, convexUser } = useCurrentUser();
  const { results: messages, status, loadMore } = usePaginatedQuery(
    api.messages.list,
    { channelId },
    { initialNumItems: 50 }
  );
  const reactionsMap = useQuery(api.reactions.getForChannel, { channelId });
  const editMessage = useMutation(api.messages.edit);
  const deleteMessage = useMutation(api.messages.remove);
  const toggleReaction = useMutation(api.reactions.toggle);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, autoScroll]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 100);
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin" onScroll={handleScroll}>
      {status === 'CanLoadMore' && (
        <div className="flex justify-center py-3">
          <button
            onClick={() => loadMore(50)}
            className="text-xs text-discord-muted hover:text-discord-text transition-colors px-3 py-1 rounded bg-discord-input hover:bg-discord-hover"
          >
            Load earlier messages
          </button>
        </div>
      )}

      {messages.length === 0 && status !== 'LoadingFirstPage' && (
        <div className="px-4 pt-16 pb-4">
          <div className="w-16 h-16 rounded-full bg-discord-input flex items-center justify-center mb-4">
            <Hash size={32} className="text-discord-text" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to #{channelName}!</h2>
          <p className="text-discord-muted">This is the start of the #{channelName} channel.</p>
        </div>
      )}

      {messages.map((msg, i) => (
        <MessageItem
          key={msg._id}
          message={msg}
          prevMessage={messages[i - 1] ?? null}
          reactions={reactionsMap?.[msg._id] ?? []}
          currentUserId={convexUser?._id}
          currentClerkId={clerkUser?.id ?? ''}
          onEdit={(id, content) => editMessage({ messageId: id, content, clerkId: clerkUser?.id ?? '' })}
          onDelete={(id) => deleteMessage({ messageId: id, clerkId: clerkUser?.id ?? '' })}
          onReact={(id, emoji) => toggleReaction({ messageId: id, emoji, clerkId: clerkUser?.id ?? '' })}
        />
      ))}

      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
