import { useState } from 'react';
import { useMutation } from 'convex/react';
import { X, Link } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useCurrentUser } from '../../hooks/useCurrentUser';

interface JoinServerModalProps {
  onClose: () => void;
  onJoined: (serverId: Id<'servers'>) => void;
}

export function JoinServerModal({ onClose, onJoined }: JoinServerModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { clerkUser } = useCurrentUser();
  const joinServer = useMutation(api.servers.join);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    if (!code || !clerkUser) return;
    setLoading(true);
    setError('');
    try {
      const serverId = await joinServer({ inviteCode: code, clerkId: clerkUser.id });
      onJoined(serverId);
    } catch (err: any) {
      setError(err.message ?? 'Invalid invite code');
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
              <h2 className="text-2xl font-bold text-white">Join a Server</h2>
              <p className="text-discord-muted text-sm mt-1">
                Enter an invite code below to join an existing server.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-discord-muted hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-discord-muted uppercase mb-1.5">
                Invite Link or Code
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-discord-muted">
                  <Link size={16} />
                </div>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => { setInviteCode(e.target.value); setError(''); }}
                  placeholder="e.g. XXXXXXXX"
                  className="w-full bg-discord-channel-bg text-discord-text rounded pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-discord-link uppercase"
                  maxLength={20}
                  autoFocus
                />
              </div>
              {error && <p className="text-discord-red text-xs mt-1">{error}</p>}
            </div>

            <div className="bg-discord-channel-bg rounded-lg p-3 text-sm text-discord-muted">
              <p className="font-semibold text-discord-text mb-1">Invites look like</p>
              <p>hTKzmak</p>
              <p>https://discord.gg/hTKzmak</p>
              <p>https://discord.gg/cool-people</p>
            </div>

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
                disabled={!inviteCode.trim() || loading}
                className="px-6 py-2.5 bg-discord-link hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
              >
                {loading ? 'Joining...' : 'Join Server'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
