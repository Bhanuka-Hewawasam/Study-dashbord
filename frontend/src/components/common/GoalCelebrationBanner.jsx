import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, X, Sparkles } from 'lucide-react';

/**
 * GoalCelebrationBanner
 * When today's study minutes hit or exceed the daily goal for the first time that day:
 * - A plane flies smoothly across the top trailing a banner: "Daily goal reached! 🎉"
 * - Triggers an elegant confetti burst with Sri Lankan/coral accents
 * - Persisted in localStorage (`studypilot_goal_celebrated_YYYY-MM-DD`) so it fires once per day
 */
export default function GoalCelebrationBanner({ todayMinutes = 0, dailyGoalMinutes = 180 }) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!dailyGoalMinutes || dailyGoalMinutes <= 0 || todayMinutes < dailyGoalMinutes) {
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const storageKey = `studypilot_goal_celebrated_${todayStr}`;
    const alreadyCelebrated = localStorage.getItem(storageKey);

    if (!alreadyCelebrated) {
      localStorage.setItem(storageKey, 'true');
      setShowBanner(true);

      // Trigger Confetti Burst with Sri Lankan & Coral palette
      try {
        confetti({
          particleCount: 85,
          spread: 70,
          origin: { y: 0.2 },
          colors: ['#FF6B4A', '#E0A83B', '#0B2D5C', '#5ED3A8', '#F7A8D8'],
        });
      } catch (err) {
        console.warn('Confetti could not be fired:', err);
      }

      // Auto dismiss after 9 seconds
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 9000);

      return () => clearTimeout(timer);
    }
  }, [todayMinutes, dailyGoalMinutes]);

  const handleDismiss = () => {
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          className="goal-celebration-strip"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          role="alert"
          aria-live="polite"
        >
          <div className="celebration-inner">
            {/* Flying Plane with trailing banner animation */}
            <motion.div
              className="flying-plane-wrapper"
              initial={{ x: '-15%' }}
              animate={{ x: '10%' }}
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 4, ease: 'easeInOut' }}
            >
              <div className="plane-banner-group">
                <span className="celebration-plane-icon">✈️</span>
                <div className="celebration-streamer">
                  <Sparkles size={14} className="sparkle-gold" />
                  <span className="celebration-banner-text">
                    Daily study goal reached! Today’s target is completed! 🎉
                  </span>
                </div>
              </div>
            </motion.div>

            <button
              onClick={handleDismiss}
              className="celebration-dismiss-btn"
              title="Dismiss announcement"
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
