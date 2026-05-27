import { useState } from 'react';
import { useMutation } from 'convex/react';
import { X, Upload } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useCurrentUser } from '../../hooks/useCurrentUser';

interface CreateServerModalProps {
  onClose: () => void;
  onCreated: (serverId: Id<'servers'>) => void;
}

export function CreateServerModal({ onClose, onCreated }: CreateServerModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { clerkUser } = useCurrentUser();
  const createServer = useMutation(api.servers.create);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !clerkUser) return;
    setLoading(true);
    try {
      const serverId = await createServer({
        name: name.trim(),
        description: description.trim() || undefined,
        clerkId: clerkUser.id,
      });
      onCreated(serverId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-discord-sidebar rounded-lg w-full max-w-md shadow-2xl">
        <div className="p-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-2xl font-bold text-white">Customize your server</h2>
              <p className="text-discord-muted text-sm mt-1">
                Give your new server a personality with a name and icon.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-discord-muted hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Server icon placeholder */}
          <div className="flex justify-center my-6">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-discord-muted flex flex-col items-center justify-center cursor-pointer hover:border-white transition-colors">
              <Upload size={20} className="text-discord-muted mb-1" />
              <span className="text-xs text-discord-muted">UPLOAD</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-discord-muted uppercase mb-1.5">
                Server Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${clerkUser?.firstName ?? 'User'}'s server`}
                className="w-full bg-discord-channel-bg text-discord-text rounded px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-discord-link"
                maxLength={100}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-discord-muted uppercase mb-1.5">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this server about?"
                className="w-full bg-discord-channel-bg text-discord-text rounded px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-discord-link resize-none"
                rows={3}
                maxLength={250}
              />
            </div>

            <p className="text-xs text-discord-muted">
              By creating a server, you agree to Discord's{' '}
              <span className="text-discord-link cursor-pointer hover:underline">
                Community Guidelines
              </span>
              .
            </p>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-discord-text hover:underline"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="px-6 py-2.5 bg-discord-link hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
