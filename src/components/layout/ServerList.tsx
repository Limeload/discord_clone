/**
 * ServerList — the narrow 72 px icon rail on the far-left of the layout.
 *
 * Layout position:
 *   ServerList (72 px) → ChannelSidebar (240 px) → main content area
 *
 * Visual pattern — circle-to-squircle morph:
 *   Each icon transitions from rounded-full (circle) to rounded-2xl
 *   (squircle) on hover or selection, a deliberate Discord UX convention
 *   that signals interactivity without requiring a label.
 *
 * Active pill:
 *   A 4 px-wide absolutely-positioned div animates its height from 0 →
 *   20 px (hover) or 40 px (selected). It is a sibling element rather
 *   than a pseudo-element so Tailwind transition utilities can drive the
 *   height change without custom CSS.
 *
 * Extension points:
 *   - Notification badges: layer a count indicator inside ServerIcon.
 *   - Drag-to-reorder: wrap the server list in a DnD context (e.g. dnd-kit).
 *   - Server folders: nest sets of ServerIcons inside collapsible groups.
 *   - Unread dot: add a small circle at bottom-right of ServerIcon using
 *     absolute positioning, toggled by a per-server unread count query.
 */
import { useQuery } from 'convex/react';
import { Plus, Compass } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Tooltip } from '../ui/Tooltip';
import { cn, stringToColor, getInitials } from '../../lib/utils';

interface ServerListProps {
  selectedServerId: Id<'servers'> | null;
  onSelectServer: (id: Id<'servers'>) => void;
  onCreateServer: () => void;
  onJoinServer: () => void;
}

/**
 * ServerIcon — one entry in the server rail.
 *
 * Falls back to `stringToColor(name)` as the background when no imageUrl is
 * provided, so every server always has a visually distinct avatar.
 *
 * The pill indicator (`left-0 w-1`) is a sibling of the button, not a
 * pseudo-element. It lives inside a `w-full` container so it can reach the
 * absolute left edge of the 72 px column; the button itself is just
 * `w-12 h-12` and centred, so a pseudo-element on the button would be offset.
 */
function ServerIcon({
  name,
  imageUrl,
  isSelected,
  onClick,
}: {
  name: string;
  imageUrl?: string | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative group w-full flex items-center justify-center" onClick={onClick}>
      {/* Height animates: 0 → 20px on hover, 0 → 40px when selected */}
      <div
        className={cn(
          'absolute left-0 w-1 bg-white rounded-r transition-all duration-200',
          isSelected ? 'h-10' : 'h-0 group-hover:h-5'
        )}
      />
      <button
        className={cn(
          'w-12 h-12 flex items-center justify-center overflow-hidden transition-all duration-200 cursor-pointer',
          isSelected ? 'rounded-2xl' : 'rounded-full hover:rounded-2xl',
          imageUrl ? '' : 'font-bold text-white text-sm'
        )}
        style={imageUrl ? undefined : { backgroundColor: stringToColor(name) }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </button>
    </div>
  );
}

export function ServerList({
  selectedServerId,
  onSelectServer,
  onCreateServer,
  onJoinServer,
}: ServerListProps) {
  const { clerkUser } = useCurrentUser();
  const servers = useQuery(
    api.servers.getByUser,
    clerkUser ? { clerkId: clerkUser.id } : 'skip'
  );

  return (
    <div className="w-18 min-w-[72px] bg-discord-channel-bg flex flex-col items-center py-3 gap-2 overflow-y-auto scrollbar-thin">
      {/* Discord home button */}
      <Tooltip label="Direct Messages">
        <button className="w-12 h-12 bg-discord-bg hover:bg-discord-link rounded-full hover:rounded-2xl transition-all duration-200 flex items-center justify-center text-discord-link hover:text-white mb-2">
          <svg width="28" height="20" viewBox="0 0 28 20" fill="currentColor">
            <path d="M23.0212 1.67671C21.3107 0.879701 19.5079 0.318244 17.6584 0C17.4062 0.461742 17.1749 0.934913 16.9708 1.4185C15.0038 1.11854 13.0526 1.11854 11.0856 1.4185C10.8809 0.934768 10.6497 0.461609 10.3978 0C8.54663 0.32161 6.74064 0.883959 5.02879 1.67671C1.44015 7.06783 0.440121 12.3232 0.940073 17.5036C2.95663 19.0029 5.19306 20.1547 7.58079 20.8991C8.13799 20.1475 8.63012 19.3491 9.05142 18.5115C8.25462 18.2055 7.49041 17.8278 6.76961 17.3877C6.96038 17.2478 7.14742 17.1044 7.32862 16.9642C9.42366 17.9909 11.6981 18.523 14.0003 18.523C16.3025 18.523 18.577 17.9909 20.672 16.9642C20.8538 17.1126 21.0408 17.256 21.2312 17.3877C20.5085 17.8303 19.7421 18.2099 18.9432 18.5149C19.3658 19.3518 19.858 20.1506 20.4159 20.9015C22.8051 20.1567 25.0428 19.0044 27.0603 17.5019C27.6424 11.5044 26.0690 6.26943 23.0212 1.67671ZM9.68041 14.3522C8.29571 14.3522 7.15081 13.0879 7.15081 11.5299C7.15081 9.97186 8.26401 8.69565 9.67649 8.69565C11.089 8.69565 12.2264 9.97186 12.2021 11.5299C12.1778 13.0879 11.0775 14.3522 9.68041 14.3522ZM18.3196 14.3522C16.9349 14.3522 15.7952 13.0879 15.7952 11.5299C15.7952 9.97186 16.9025 8.69565 18.3196 8.69565C19.7367 8.69565 20.8679 9.97186 20.8439 11.5299C20.82 13.0879 19.7257 14.3522 18.3196 14.3522Z" />
          </svg>
        </button>
      </Tooltip>

      <div className="w-8 h-px bg-discord-hover my-1" />

      {/* Server list */}
      {(servers ?? []).map((server) =>
        server ? (
          <Tooltip key={server._id} label={server.name}>
            <ServerIcon
              name={server.name}
              imageUrl={server.imageUrl}
              isSelected={selectedServerId === server._id}
              onClick={() => onSelectServer(server._id)}
            />
          </Tooltip>
        ) : null
      )}

      <div className="w-8 h-px bg-discord-hover my-1" />

      {/* Add server */}
      <Tooltip label="Add a Server">
        <button
          onClick={onCreateServer}
          className="w-12 h-12 bg-discord-bg hover:bg-discord-green rounded-full hover:rounded-2xl transition-all duration-200 flex items-center justify-center text-discord-green hover:text-white"
        >
          <Plus size={24} />
        </button>
      </Tooltip>

      {/* Discover servers */}
      <Tooltip label="Explore Public Servers">
        <button
          onClick={onJoinServer}
          className="w-12 h-12 bg-discord-bg hover:bg-discord-green rounded-full hover:rounded-2xl transition-all duration-200 flex items-center justify-center text-discord-green hover:text-white"
        >
          <Compass size={24} />
        </button>
      </Tooltip>
    </div>
  );
}
