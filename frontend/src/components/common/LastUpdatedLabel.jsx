import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * LastUpdatedLabel
 * Shows a small "Updated just now" / "Updated X min ago" label.
 * Receives the last successful refresh time from useAutoRefresh.
 * Re-evaluates every 30 seconds so the text stays current.
 */
export default function LastUpdatedLabel({ lastRefreshed }) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const compute = () => {
      if (!lastRefreshed) {
        setLabel('');
        return;
      }
      const diffSec = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000);
      if (diffSec < 10) {
        setLabel('Updated just now');
      } else if (diffSec < 60) {
        setLabel(`Updated ${diffSec}s ago`);
      } else {
        const mins = Math.floor(diffSec / 60);
        setLabel(`Updated ${mins} min ago`);
      }
    };

    compute();
    const id = setInterval(compute, 10_000);
    return () => clearInterval(id);
  }, [lastRefreshed]);

  if (!label) return null;

  return (
    <span className="last-updated-label" aria-live="polite">
      <RefreshCw size={11} className="refresh-icon-spin-once" />
      {label}
    </span>
  );
}
