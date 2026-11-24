import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useAutoRefresh
 *
 * Calls `refreshFn` on:
 *   1. Mount (immediately)
 *   2. Every `intervalMs` milliseconds while the tab is open
 *   3. When the browser tab becomes visible again (Page Visibility API)
 *
 * Also returns the last successful refresh time for display.
 *
 * @param {Function} refreshFn   Async function to call on each refresh cycle
 * @param {number}   intervalMs  Polling interval in milliseconds (default: 60 000 = 1 min)
 * @returns {{ lastRefreshed: Date|null, triggerRefresh: Function }}
 */
export function useAutoRefresh(refreshFn, intervalMs = 60_000) {
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const intervalRef = useRef(null);

  const triggerRefresh = useCallback(async () => {
    const succeeded = await refreshFn();
    if (succeeded === false) return false;
    setLastRefreshed(new Date());
    return true;
  }, [refreshFn]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      void triggerRefresh();
    }, 0);

    // Polling interval
    intervalRef.current = setInterval(() => {
      void triggerRefresh();
    }, intervalMs);

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void triggerRefresh();
      }
    };
    document.addEventListener('visibilitychange', refreshIfVisible);
    window.addEventListener('focus', refreshIfVisible);

    return () => {
      clearTimeout(initialRefresh);
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.removeEventListener('focus', refreshIfVisible);
    };
  }, [triggerRefresh, intervalMs]);

  return { lastRefreshed, triggerRefresh };
}
