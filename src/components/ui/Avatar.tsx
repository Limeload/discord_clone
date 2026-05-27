import { getInitials, stringToColor } from '../../lib/utils';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isOnline?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

export function Avatar({ name, imageUrl, size = 'md', isOnline }: AvatarProps) {
  const sizeClass = sizeClasses[size];

  return (
    <div className="relative inline-flex shrink-0">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className={`${sizeClass} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white`}
          style={{ backgroundColor: stringToColor(name) }}
        >
          {getInitials(name)}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 block w-3 h-3 rounded-full border-2 border-discord-sidebar ${
            isOnline ? 'bg-discord-green' : 'bg-discord-muted'
          }`}
        />
      )}
    </div>
  );
}
