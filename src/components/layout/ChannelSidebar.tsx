import { useState, useRef, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { UserButton } from '@clerk/clerk-react';
import {
  Hash,
  Volume2,
  ChevronDown,
  ChevronRight,
  Plus,
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  UserPlus,
  LogOut,
  Trash2,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useServerPermissions } from '../../hooks/useServerPermissions';
import { useServerActions } from '../../hooks/useServerActions';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';

interface ChannelSidebarProps {
  serverId: Id<'servers'>;
  selectedChannelId: Id<'channels'> | null;
  onSelectChannel: (id: Id<'channels'>, type: 'text' | 'voice' | 'video') => void;
  onCreateChannel: () => void;
  onInvite: () => void;
  activeVoiceChannelId: Id<'channels'> | null;
  isMuted: boolean;
  isDeafened: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onLeaveVoice: () => void;
  onLeaveServer: () => void;
  onDeleteServer: () => void;
}

function ServerDropdown({
  serverId,
  isOwner,
  onInvite,
  onCreateChannel,
  onRename,
  onLeave,
  onDelete,
  onClose,
}: {
  serverId: Id<'servers'>;
  isOwner: boolean;
  onInvite: () => void;
  onCreateChannel: () => void;
  onRename: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const items = [
    { label: 'Invite People', icon: <UserPlus size={16} />, action: onInvite, color: 'text-discord-link' },
    { label: 'Create Channel', icon: <Plus size={16} />, action: onCreateChannel },
    isOwner
      ? { label: 'Rename Server', icon: <Edit3 size={16} />, action: onRename }
      : null,
    { type: 'divider' as const },
    isOwner
      ? { label: 'Delete Server', icon: <Trash2 size={16} />, action: onDelete, color: 'text-discord-red' }
      : { label: 'Leave Server', icon: <LogOut size={16} />, action: onLeave, color: 'text-discord-red' },
  ].filter(Boolean);

  return (
    <div
      ref={ref}
      className="absolute top-full left-2 right-2 mt-1 bg-[#111214] rounded-md shadow-2xl border border-white/10 py-1.5 z-50"
    >
      {items.map((item, i) => {
        if (!item) return null;
        if ('type' in item && item.type === 'divider') {
          return <div key={i} className="my-1.5 border-t border-white/10" />;
        }
        return (
          <button
            key={i}
            onClick={() => { (item as any).action(); onClose(); }}
            className={cn(
              'w-full flex items-center gap-2 px-2.5 py-1.5 text-sm rounded mx-1 hover:bg-discord-link hover:text-white transition-colors',
              (item as any).color ?? 'text-discord-text',
              'w-[calc(100%-8px)]'
            )}
          >
            {(item as any).icon}
            {(item as any).label}
          </button>
        );
      })}
    </div>
  );
}

function ChannelItem({
  channel,
  isSelected,
  isActive,
  canManage,
  onClick,
  onDelete,
}: {
  channel: { _id: Id<'channels'>; name: string; type: string };
  isSelected: boolean;
  isActive?: boolean;
  canManage: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = channel.type === 'text' ? Hash : Volume2;

  return (
    <div
      className="relative mx-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm transition-colors group',
          isSelected || isActive
            ? 'bg-discord-hover text-white'
            : 'text-discord-muted hover:bg-discord-hover/50 hover:text-discord-text'
        )}
      >
        <Icon size={18} className="shrink-0" />
        <span className="truncate flex-1 text-left">{channel.name}</span>
        {isActive && <span className="text-xs text-discord-green font-semibold">●</span>}
      </button>
      {hovered && canManage && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-discord-muted hover:text-discord-red transition-colors"
          title="Delete channel"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export function ChannelSidebar({
  serverId,
  selectedChannelId,
  onSelectChannel,
  onCreateChannel,
  onInvite,
  activeVoiceChannelId,
  isMuted,
  isDeafened,
  onToggleMute,
  onToggleDeafen,
  onLeaveVoice,
  onLeaveServer,
  onDeleteServer,
}: ChannelSidebarProps) {
  const { clerkUser, convexUser } = useCurrentUser();
  const server = useQuery(api.servers.getById, { serverId });
  const channels = useQuery(api.channels.getByServer, { serverId });

  const { isOwner, canManage, members, onlineMembers, offlineMembers } =
    useServerPermissions(serverId, convexUser?._id);

  const {
    handleDeleteChannel,
    renamingServer,
    renameValue,
    setRenameValue,
    renameError,
    handleRenameServer,
    startRenaming,
    cancelRenaming,
  } = useServerActions(serverId, clerkUser?.id);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [showMembers, setShowMembers] = useState(true);

  const textChannels = (channels ?? []).filter((c) => c.type === 'text');
  const voiceChannels = (channels ?? []).filter((c) => c.type !== 'text');

  function toggleCategory(cat: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  return (
    <div className="w-60 bg-discord-sidebar flex flex-col">
      {/* Server header */}
      <div className="relative">
        {renamingServer ? (
          <div className="border-b border-black/30">
            <div className="h-12 flex items-center px-3 gap-1">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameServer();
                  if (e.key === 'Escape') cancelRenaming();
                }}
                maxLength={100}
                className="flex-1 bg-discord-input text-white text-sm px-2 py-1 rounded outline-none focus:ring-1 focus:ring-discord-link"
              />
              <button onClick={handleRenameServer} className="p-1 text-discord-green hover:text-white">
                <Check size={14} />
              </button>
              <button onClick={cancelRenaming} className="p-1 text-discord-muted hover:text-white">
                <X size={14} />
              </button>
            </div>
            {renameError && (
              <p className="text-xs text-red-400 px-3 pb-1.5">{renameError}</p>
            )}
          </div>
        ) : (
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="h-12 w-full flex items-center px-4 border-b border-black/30 shadow-sm font-semibold text-white hover:bg-discord-hover cursor-pointer transition-colors"
          >
            <span className="truncate flex-1 text-left">{server?.name}</span>
            <ChevronDown size={18} className={cn('transition-transform', dropdownOpen && 'rotate-180')} />
          </button>
        )}

        {dropdownOpen && (
          <ServerDropdown
            serverId={serverId}
            isOwner={isOwner ?? false}
            onInvite={onInvite}
            onCreateChannel={onCreateChannel}
            onRename={() => startRenaming(server?.name ?? '')}
            onLeave={onLeaveServer}
            onDelete={onDeleteServer}
            onClose={() => setDropdownOpen(false)}
          />
        )}
      </div>

      {/* Channels */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin py-2">
        {/* Text channels */}
        <div className="mb-1">
          <button
            className="flex items-center w-full px-4 py-1 text-xs font-semibold text-discord-muted hover:text-discord-text uppercase tracking-wide group"
            onClick={() => toggleCategory('text')}
          >
            {collapsedCategories.has('text') ? (
              <ChevronRight size={12} className="mr-1" />
            ) : (
              <ChevronDown size={12} className="mr-1" />
            )}
            Text Channels
            {canManage && (
              <button
                onClick={(e) => { e.stopPropagation(); onCreateChannel(); }}
                className="ml-auto opacity-0 group-hover:opacity-100 hover:text-white"
              >
                <Plus size={14} />
              </button>
            )}
          </button>
          {!collapsedCategories.has('text') &&
            textChannels.map((ch) => (
              <ChannelItem
                key={ch._id}
                channel={ch}
                isSelected={selectedChannelId === ch._id}
                canManage={canManage ?? false}
                onClick={() => onSelectChannel(ch._id, 'text')}
                onDelete={() => handleDeleteChannel(ch._id)}
              />
            ))}
        </div>

        {/* Voice channels */}
        <div className="mb-1">
          <button
            className="flex items-center w-full px-4 py-1 text-xs font-semibold text-discord-muted hover:text-discord-text uppercase tracking-wide group"
            onClick={() => toggleCategory('voice')}
          >
            {collapsedCategories.has('voice') ? (
              <ChevronRight size={12} className="mr-1" />
            ) : (
              <ChevronDown size={12} className="mr-1" />
            )}
            Voice Channels
            {canManage && (
              <button
                onClick={(e) => { e.stopPropagation(); onCreateChannel(); }}
                className="ml-auto opacity-0 group-hover:opacity-100 hover:text-white"
              >
                <Plus size={14} />
              </button>
            )}
          </button>
          {!collapsedCategories.has('voice') &&
            voiceChannels.map((ch) => (
              <ChannelItem
                key={ch._id}
                channel={ch}
                isSelected={selectedChannelId === ch._id}
                isActive={activeVoiceChannelId === ch._id}
                canManage={canManage ?? false}
                onClick={() => onSelectChannel(ch._id, ch.type as 'voice' | 'video')}
                onDelete={() => handleDeleteChannel(ch._id)}
              />
            ))}
        </div>

        {/* Members list */}
        <div className="mt-2">
          <button
            className="flex items-center w-full px-4 py-1 text-xs font-semibold text-discord-muted hover:text-discord-text uppercase tracking-wide"
            onClick={() => setShowMembers((v) => !v)}
          >
            {showMembers ? (
              <ChevronDown size={12} className="mr-1" />
            ) : (
              <ChevronRight size={12} className="mr-1" />
            )}
            Members — {members?.length ?? 0}
          </button>

          {showMembers && (
            <div className="px-2">
              {onlineMembers.length > 0 && (
                <>
                  <p className="px-2 pt-2 pb-1 text-xs font-semibold text-discord-muted uppercase">
                    Online — {onlineMembers.length}
                  </p>
                  {onlineMembers.map((m) =>
                    m.user ? (
                      <div
                        key={m._id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-discord-hover cursor-pointer"
                      >
                        <Avatar name={m.user.name} imageUrl={m.user.imageUrl} size="sm" isOnline={true} />
                        <div className="min-w-0">
                          <p className="text-sm text-discord-text truncate">{m.user.name}</p>
                          <p className="text-xs text-discord-muted truncate capitalize">{m.role}</p>
                        </div>
                      </div>
                    ) : null
                  )}
                </>
              )}
              {offlineMembers.length > 0 && (
                <>
                  <p className="px-2 pt-2 pb-1 text-xs font-semibold text-discord-muted uppercase">
                    Offline — {offlineMembers.length}
                  </p>
                  {offlineMembers.map((m) =>
                    m.user ? (
                      <div
                        key={m._id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-discord-hover cursor-pointer opacity-50"
                      >
                        <Avatar name={m.user.name} imageUrl={m.user.imageUrl} size="sm" isOnline={false} />
                        <p className="text-sm text-discord-muted truncate">{m.user.name}</p>
                      </div>
                    ) : null
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User panel */}
      <div className="h-14 bg-discord-channel-bg flex items-center px-2 gap-2">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {convexUser?.name ?? clerkUser?.fullName ?? 'User'}
          </p>
          <p className="text-xs text-discord-muted truncate">
            #{convexUser?.username ?? clerkUser?.username ?? '0000'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMute}
            className={cn(
              'p-1.5 rounded hover:bg-discord-hover transition-colors',
              isMuted ? 'text-discord-red' : 'text-discord-muted hover:text-discord-text'
            )}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button
            onClick={onToggleDeafen}
            className={cn(
              'p-1.5 rounded hover:bg-discord-hover transition-colors',
              isDeafened ? 'text-discord-red' : 'text-discord-muted hover:text-discord-text'
            )}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            <Headphones size={16} />
          </button>
          {activeVoiceChannelId && (
            <button
              onClick={onLeaveVoice}
              className="p-1.5 rounded hover:bg-discord-hover text-discord-red transition-colors"
              title="Disconnect from voice"
            >
              <PhoneOff size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
