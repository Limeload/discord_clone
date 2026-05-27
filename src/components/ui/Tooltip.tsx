import { useState } from 'react';

interface TooltipProps {
  label: string;
  children: React.ReactNode;
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
