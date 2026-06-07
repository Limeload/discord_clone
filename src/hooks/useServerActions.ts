import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

const RESERVED_SERVER_NAMES = new Set([
  'discord', 'admin', 'administrator', 'staff', 'support', 'official', 'system', 'null', 'undefined',
]);

export function useServerActions(serverId: Id<'servers'>, clerkId: string | undefined) {
  const deleteChannelMutation = useMutation(api.channels.remove);
  const renameServerMutation = useMutation(api.servers.rename);

  const [renamingServer, setRenamingServer] = useState(false);
  const [renameValue, setRenameValueRaw] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  async function handleDeleteChannel(channelId: Id<'channels'>) {
    if (!clerkId) return;
    if (!confirm('Delete this channel? This cannot be undone.')) return;
    await deleteChannelMutation({ channelId, clerkId });
  }

  function setRenameValue(value: string) {
    setRenameValueRaw(value);
    setRenameError(null);
  }

  async function handleRenameServer() {
    if (!clerkId) return;
    const name = renameValue.trim();
    if (name.length < 2 || name.length > 100) {
      setRenameError('Name must be 2–100 characters');
      return;
    }
    if (RESERVED_SERVER_NAMES.has(name.toLowerCase())) {
      setRenameError(`"${name}" is a reserved name`);
      return;
    }
    setRenameError(null);
    try {
      await renameServerMutation({ serverId, name, clerkId });
      setRenamingServer(false);
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Rename failed');
    }
  }

  function startRenaming(currentName: string) {
    setRenameValueRaw(currentName);
    setRenameError(null);
    setRenamingServer(true);
  }

  function cancelRenaming() {
    setRenamingServer(false);
    setRenameError(null);
  }

  return {
    handleDeleteChannel,
    renamingServer,
    renameValue,
    setRenameValue,
    renameError,
    handleRenameServer,
    startRenaming,
    cancelRenaming,
  };
}
