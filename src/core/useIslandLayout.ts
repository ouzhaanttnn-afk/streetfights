import { useEffect, useState } from 'react';

// Dynamic Island iPhones report a top safe area of 59-62pt (notch iPhones 44-50, Home-button iPhones 20 or 0).
// On those phones the native shell hides the status bar (see ios/App/App/SceneDelegate.swift) and the header
// moves into the band beside the island.
export const ISLAND_MIN_INSET = 51;

function readTopInset(): number {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top, 0px)';
  document.body.appendChild(probe);
  const px = parseFloat(getComputedStyle(probe).paddingTop) || 0;
  probe.remove();
  return px;
}

export function detectIsland(): boolean {
  if (typeof window === 'undefined') return false;
  return readTopInset() >= ISLAND_MIN_INSET && window.innerWidth <= 500 && window.innerHeight > window.innerWidth;
}

export function useIslandLayout(): boolean {
  const [island, setIsland] = useState(detectIsland);
  useEffect(() => {
    const update = () => {
      const next = detectIsland();
      setIsland(next);
      document.documentElement.classList.toggle('has-island', next);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return island;
}
