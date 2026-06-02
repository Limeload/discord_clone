import { useState } from 'react';
import { useMutation } from 'convex/react';
import { X, Hash, Volume2 } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { cn } from '../../lib/utils';

interface CreateChannelModalProps {
  serverId: Id<'servers'>;
  onClose: () => void;
  onCreated: (channelId: Id<'channels'>) => void;
}

type ChannelType = 'text' | 'voice' | 'video';

const channelTypes: { type: ChannelType; icon: React.ReactNode; label: string; desc: string }[] = [
  {
    type: 'text',
    icon: <Hash size={22} />,
    label: 'Text',
    desc: 'Send messages, images, GIFs, emoji, opinions, and puns',
  },
  {
    type: 'voice',
    icon: <Volume2 size={22} />,
    label: 'Voice',
    desc: 'Hang out together with voice and screen share',
  },
  {
    type: 'video',
    icon: <Volume2 size={22} />,
    label: 'Video',
    desc: 'Hang out together with video, voice, and screen share',
  },
];

export function CreateChannelModal({
  serverId,
  onClose,
  onCreated,
}: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ChannelType>('text');
  const [loading, setLoading] = useState(false);
  const { clerkUser } = useCurrentUser();
  const createChannel = useMutation(api.channels.create);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !clerkUser) return;
    setLoading(true);
    try {
      const channelId = await createChannel({
        name: name.trim(),
        type,
        serverId,
        clerkId: clerkUser.id,
      });
      onCreated(channelId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-discord-sidebar rounded-lg w-full max-w-md shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Create Channel</h2>
              <p className="text-discord-muted text-sm mt-0.5">in your server</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-discord-muted hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-discord-muted uppercase mb-2">
                Channel Type
              </label>
              <div className="space-y-2">
                {channelTypes.map((ct) => (
                  <button
                    key={ct.type}
                    type="button"
                    onClick={() => setType(ct.type)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                      type === ct.type
                        ? 'bg-discord-hover text-white'
                        : 'hover:bg-discord-hover/50 text-discord-muted'
                    )}
                  >
                    <span>{ct.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{ct.label}</p>
                      <p className="text-xs text-discord-muted">{ct.desc}</p>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        type === ct.type
                          ? 'border-discord-link bg-discord-link'
                          : 'border-discord-muted'
                      )}
                    >
                      {type === ct.type && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-discord-muted uppercase mb-1.5">
                Channel Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-muted">
                  {type === 'text' ? <Hash size={16} /> : <Volume2 size={16} />}
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                  }
                  placeholder="new-channel"
                  className="w-full bg-discord-channel-bg text-discord-text rounded pl-8 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-discord-link"
                  maxLength={100}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-discord-text hover:underline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="px-6 py-2.5 bg-discord-link hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
              >
                {loading ? 'Creating...' : 'Create Channel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
