'use client';

import React, { useState, useRef, useEffect } from 'react';

const TOOLTIP_OFFSET_PX = 8;
const TOOLTIP_DELAY_MS = 150;

interface TooltipProps {
  text: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, TOOLTIP_DELAY_MS);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getPositionStyles = (): React.CSSProperties => {
    const offset = TOOLTIP_OFFSET_PX;
    switch (position) {
      case 'top':
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: `${offset}px` };
      case 'bottom':
        return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: `${offset}px` };
      case 'left':
        return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: `${offset}px` };
      case 'right':
        return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: `${offset}px` };
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className="absolute z-50 px-2 py-1 text-xs text-white bg-[#212126] border border-[#302e33] rounded whitespace-nowrap pointer-events-none"
          style={getPositionStyles()}
        >
          {text}
        </div>
      )}
    </div>
  );
}
