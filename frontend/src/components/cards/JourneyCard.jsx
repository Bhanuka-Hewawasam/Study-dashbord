import React, { useEffect, useState } from 'react';
import { Compass, Plane, ArrowRight, Award, MapPin, CheckCircle2 } from 'lucide-react';
import { journeyApi } from '../../api/client';
import AnimatedCounter from '../common/AnimatedCounter';

/**
 * JourneyCard
 * Compact gamification card featured on the main Dashboard.
 * Visualizes the user's progress towards the next global study milestone
 * with Deep Blue (#0B2D5C), Gold (#E0A83B), and Coral accents.
 */
export default function JourneyCard({ onNavigateToJourney }) {
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    journeyApi
      .get()
      .then((data) => setJourneyData(data))
      .catch((err) => console.error('Failed to load journey stats in JourneyCard:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalHours = journeyData?.total_hours ?? 0;
  const nextDest = journeyData?.next_destination;
  const unlockedCount = journeyData?.unlocked_count ?? 1;
  const progressPct = nextDest?.progress_pct ?? 0;
  const isCompleted = nextDest?.completed;

  return (
    <section className="dashboard-card journey-summary-card">
      {/* Top Header */}
      <div className="journey-card-header">
        <div className="journey-header-title-wrap">
          <div className="journey-compass-badge">
            <Compass size={18} className="compass-icon" />
          </div>
          <div>
            <h2 className="card-heading">Study Journey</h2>
            <span className="card-subheading">
              {isCompleted
                ? 'All global study destinations unlocked!'
                : `Next Destination: ${nextDest?.city || 'Next Stop'} (${nextDest?.code || ''})`}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToJourney}
          className="journey-view-all-btn"
          title="Open interactive journey map"
        >
          <span>Full Map</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Main Progress Row */}
      <div className="journey-card-content">
        <div className="journey-stats-strip">
          <div className="journey-stat-block">
            <span className="journey-stat-label">Total Study Time</span>
            <div className="journey-stat-num">
              <AnimatedCounter value={totalHours} decimals={1} suffix="h" />
            </div>
          </div>

          <div className="journey-stat-divider" />

          <div className="journey-stat-block">
            <span className="journey-stat-label">Milestones Reached</span>
            <div className="journey-stat-num highlight-gold">
              <AnimatedCounter value={unlockedCount} suffix=" / 6" />
            </div>
          </div>

          <div className="journey-stat-divider" />

          <div className="journey-stat-block">
            <span className="journey-stat-label">
              {isCompleted ? 'Status' : 'Hours Remaining'}
            </span>
            <div className="journey-stat-num">
              {isCompleted ? (
                <span className="journey-badge-pill gold-pill">Master Pilot 🏆</span>
              ) : (
                <AnimatedCounter
                  value={nextDest?.hours_remaining ?? 0}
                  decimals={1}
                  suffix="h"
                />
              )}
            </div>
          </div>
        </div>

        {/* Flight Path Progress Bar with Cruising Plane */}
        <div className="journey-track-wrapper">
          <div className="journey-track-labels">
            <span className="track-origin">
              <MapPin size={12} className="pin-icon" /> CMB (Colombo)
            </span>
            <span className="track-dest">
              {nextDest ? `${nextDest.code} (${nextDest.city})` : 'LHR (London)'}
            </span>
          </div>

          <div className="journey-progress-track">
            <div
              className="journey-progress-fill"
              style={{ width: `${Math.min(100, Math.max(4, progressPct))}%` }}
            >
              <div className="cruising-plane-marker" title={`${progressPct}% toward ${nextDest?.city}`}>
                <Plane size={15} className="plane-track-icon" />
              </div>
            </div>
          </div>

          <div className="journey-track-footer">
            <span className="track-progress-info">
              {isCompleted
                ? 'All flight legs completed across 150 hours of study!'
                : `${progressPct}% completed towards ${nextDest?.city} (${nextDest?.target_hours}h target)`}
            </span>
            <span className="track-leg-badge">Leg {unlockedCount} of 6</span>
          </div>
        </div>
      </div>
    </section>
  );
}
