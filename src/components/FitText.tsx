import React, { useLayoutEffect, useRef } from 'react';

interface FitTextProps {
  text: string;
  max?: number; // font size in px to start from
  min?: number; // smallest font size (two lines) before the line clamp takes over
  oneLineMin?: number; // first try one line down to this size, then wrap to `lines` lines
  lines?: number; // allowed lines
  className?: string;
  style?: React.CSSProperties;
}

// Shows the whole text: shrinks it on one line first, then wraps up to `lines` lines and shrinks further.
// Used for fighter names (HUD, header, VS card) so no name is cut off in any language at 375 pt.
export const FitText: React.FC<FitTextProps> = ({ text, max = 12, min = 8.5, oneLineMin, lines = 2, className = '', style }) => {
  const ref = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fits = (size: number, n: number) => el.scrollHeight <= Math.ceil(size * 1.15 * n) + 1 && el.scrollWidth <= el.clientWidth + 1;
    const fit = () => {
      let size = max;
      el.style.fontSize = `${size}px`;
      if (oneLineMin !== undefined) {
        el.style.whiteSpace = 'nowrap';
        while (size > oneLineMin && !fits(size, 1)) {
          size -= 0.5;
          el.style.fontSize = `${size}px`;
        }
        el.style.whiteSpace = '';
        if (fits(size, 1)) return;
        size = Math.max(min, size);
      }
      while (size > min && !fits(size, lines)) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement ?? el);
    return () => ro.disconnect();
  }, [text, max, min, oneLineMin, lines]);

  return (
    <span
      ref={ref}
      className={`block leading-[1.15] break-words ${className}`}
      style={{ fontSize: max, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lines, overflow: 'hidden', ...style }}
    >
      {text}
    </span>
  );
};
