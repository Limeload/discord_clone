import { useState } from 'react';
import { useQuery } from 'convex/react';
import { X, Copy, Check } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface InviteModalProps {
  serverId: Id<'servers'>;
  onClose: () => void;
}

export function InviteModal({ serverId, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const server = useQuery(api.servers.getById, { serverId });

  function handleCopy() {
    if (!server) return;
    navigator.clipboard.writeText(server.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-discord-sidebar rounded-lg w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Invite people to {server?.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-discord-muted hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-discord-muted text-sm mb-4">
          Share this invite code with others to add them to your server.
        </p>

        <div className="flex items-center gap-2 bg-discord-channel-bg rounded-lg p-3">
          <code className="flex-1 text-discord-text font-mono text-sm">
            {server?.inviteCode ?? '...'}
          </code>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-discord-link hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <p className="text-xs text-discord-muted mt-3">
          Your invite link expires never. Ask others to use this code when joining.
        </p>
      </div>
    </div>
  );
}
