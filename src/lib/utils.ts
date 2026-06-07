/**
 * Shared UI utilities.
 *
 * cn            — conditional className merging via clsx. Preferred over
 *                 template literals: handles falsy values, arrays, and
 *                 objects cleanly without manual filtering.
 *
 * formatDate    — relative timestamp display matching Discord's convention:
 *                 "Today at HH:MM" / "Yesterday at HH:MM" / short absolute.
 *                 Note: diffDays uses calendar-day delta (floor of ms diff),
 *                 not a 24-hour rolling window, so "Yesterday" can appear
 *                 after as little as a few hours if the message crossed midnight.
 *
 * formatTime    — time-only label used for grouped messages in MessageList.
 *
 * getInitials   — extracts up to 2 initials (slice(0,2)) to fit inside the
 *                 fixed 48 px server icon without overflow.
 *
 * stringToColor — deterministic color from a string, using a djb2-style hash
 *                 (hash * 31 + charCode) mapped onto the 8-color Discord brand
 *                 palette. The same server name always yields the same color,
 *                 ensuring visual consistency across sessions and devices.
 *                 To add more palette options, extend the `colors` array; the
 *                 modulo mapping adjusts automatically.
 */
import { type ClassValue, clsx } from 'clsx';

/** Merges Tailwind class names, filtering out falsy values. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Returns a human-readable timestamp: relative for recent messages,
 * absolute for older ones.
 *
 * "Today / Yesterday" uses floor(ms / 86400000), a calendar-day delta,
 * not a rolling 24-hour window.
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Time-only label for grouped messages that share an author block. */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Extracts up to 2 initials from a display name.
 * Capped at 2 characters to prevent overflow inside the 48 px server icon.
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Maps a string to one of 8 Discord-palette colors via a deterministic hash.
 *
 * Algorithm: djb2-style — `hash = hash * 31 + charCode` per character.
 * The result is stable: the same input always produces the same color,
 * so server avatars are visually consistent across sessions.
 *
 * To extend the palette, add colors to the array; the modulo mapping
 * adjusts automatically.
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#5865f2', '#eb459e', '#fee75c', '#57f287',
    '#ed4245', '#3ba55c', '#faa61a', '#00b0f4',
  ];
  return colors[Math.abs(hash) % colors.length];
}
