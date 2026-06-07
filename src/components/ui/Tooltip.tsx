/**
 * Tooltip — a lightweight hover tooltip built on visibility state and CSS
 * absolute positioning. No portal, no Floating UI dependency.
 *
 * Trade-offs:
 *   This implementation is intentionally minimal. It works correctly in the
 *   server rail and channel sidebar because those containers do not use
 *   `overflow: hidden`. If a future parent clips its children, the tooltip
 *   will also be clipped; in that case, migrate to a portal-based approach
 *   (e.g. Radix UI Tooltip or Floating UI) and remove this component.
 *
 * `pointer-events-none` on the floating label:
 *   Without this, moving the cursor from the trigger onto the tooltip div
 *   fires a mouseLeave on the trigger, which hides the tooltip, which
 *   re-enters the trigger — causing a flicker loop.
 *
 * `side` defaults to 'right':
 *   The primary consumer is the server rail where every tooltip should
 *   appear to the right, pointing toward the content area. Callers in other
 *   positions (e.g. a top bar) should pass the appropriate side explicitly.
 */
import { useState } from 'react';

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  /** Which side of the trigger the tooltip appears on. @default 'right' */
  side?: 'right' | 'top' | 'bottom' | 'left';
}

export function Tooltip({ label, children, side = 'right' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    right: 'left-full ml-3 top-1/2 -translate-y-1/2',
    left: 'right-full mr-3 top-1/2 -translate-y-1/2',
    top: 'bottom-full mb-3 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-3 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-50 pointer-events-none ${positionClasses[side]}`}
        >
          <div className="bg-black text-white text-xs font-semibold px-3 py-1.5 rounded whitespace-nowrap shadow-lg">
            {label}
          </div>
        </div>
      )}
    </div>
  );
}
