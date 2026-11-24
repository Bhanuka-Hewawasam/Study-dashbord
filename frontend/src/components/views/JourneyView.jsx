import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Plane,
  CheckCircle2,
  Lock,
  Award,
  Sparkles,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { journeyApi } from '../../api/client';
import { JOURNEY_MILESTONES } from '../../config/journeyConfig';
import AnimatedCounter from '../common/AnimatedCounter';

/**
 * JourneyView
 * Full-page interactive study journey tracker.
 * Features an SVG curved world route map connecting Colombo, Chennai, Dubai,
 * Singapore, Melbourne, and London with live progress, plane positioning,
 * waypoint inspections, and celebratory unlocks.
 */
export default function JourneyView() {
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  useEffect(() => {
    journeyApi
      .get()
      .then((data) => {
        setJourney(data);
        // Default preview to next destination or last unlocked
        if (data?.next_destination) {
          const matched = JOURNEY_MILESTONES.find(
            (m) => m.code === data.next_destination.code
          );
          if (matched) setSelectedMilestone(matched);
        } else if (JOURNEY_MILESTONES.length > 0) {
          setSelectedMilestone(JOURNEY_MILESTONES[0]);
        }
      })
      .catch((err) => console.error('Failed to load journey:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalHours = journey?.total_hours ?? 0;
  const unlockedCodes = journey?.unlocked_destinations || ['CMB'];
  const unlockedCount = journey?.unlocked_count ?? 1;

  // Calculate overall path progress (0% to 100% across all 150 hours)
  const maxTargetHours = 150.0;
  const overallProgressPct = Math.min(100, Math.max(0, (totalHours / maxTargetHours) * 100));

  // Trigger celebratory confetti for milestone clicks
  const triggerConfetti = (milestone) => {
    setSelectedMilestone(milestone);
    const isUnlocked = unlockedCodes.includes(milestone.code);
    if (isUnlocked) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#E0A83B', '#0B2D5C', '#FF6B4A', '#5ED3A8'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  };

  // Helper to interpolate plane coordinate along the 5 segments
  const calculatePlaneCoordinates = () => {
    if (JOURNEY_MILESTONES.length < 2) return { x: 120, y: 340, angle: 0 };

    // Find current active segment
    for (let i = 0; i < JOURNEY_MILESTONES.length - 1; i++) {
      const cur = JOURNEY_MILESTONES[i];
      const nxt = JOURNEY_MILESTONES[i + 1];

      if (totalHours <= nxt.targetHours) {
        const segSpan = nxt.targetHours - cur.targetHours;
        const segProgress = segSpan > 0 ? (totalHours - cur.targetHours) / segSpan : 0;
        const clampedProg = Math.max(0, Math.min(1, segProgress));

        const x = cur.mapX + (nxt.mapX - cur.mapX) * clampedProg;
        const y = cur.mapY + (nxt.mapY - cur.mapY) * clampedProg;
        const angle = Math.atan2(nxt.mapY - cur.mapY, nxt.mapX - cur.mapX) * (180 / Math.PI);

        return { x, y, angle };
      }
    }

    // Past London
    const last = JOURNEY_MILESTONES[JOURNEY_MILESTONES.length - 1];
    return { x: last.mapX, y: last.mapY, angle: 0 };
  };

  const planePos = calculatePlaneCoordinates();

  return (
    <div className="journey-page-container">
      {/* Top Banner / Header */}
      <header className="journey-header">
        <div className="journey-header-left">
          <div className="journey-title-badge">
            <Compass size={22} className="compass-spin-slow" />
            <span>GLOBAL STUDY ROUTE</span>
          </div>
          <h1 className="view-title">Study Journey Map</h1>
          <p className="view-subtitle">
            Travel the globe through your study hours. Each session moves your flight closer
            to the next destination!
          </p>
        </div>

        {/* Global Progress Summary Card */}
        <div className="journey-header-stats-card">
          <div className="journey-stat-chip">
            <span className="chip-label">Total Study Hours</span>
            <span className="chip-val">
              <AnimatedCounter value={totalHours} decimals={1} suffix="h" />
            </span>
          </div>
          <div className="journey-stat-chip">
            <span className="chip-label">Destinations</span>
            <span className="chip-val gold-text">
              <AnimatedCounter value={unlockedCount} suffix=" / 6" />
            </span>
          </div>
          <div className="journey-stat-chip">
            <span className="chip-label">Overall Progress</span>
            <span className="chip-val coral-text">
              <AnimatedCounter value={overallProgressPct} decimals={0} suffix="%" />
            </span>
          </div>
        </div>
      </header>

      {/* Interactive SVG Flight Route Map */}
      <section className="interactive-map-card">
        <div className="map-card-top-bar">
          <div className="map-legend-items">
            <span className="legend-dot unlocked-dot" />
            <span className="legend-text">Unlocked Milestone</span>
            <span className="legend-dot locked-dot" />
            <span className="legend-text">Locked Destination</span>
            <span className="legend-dot plane-dot" />
            <span className="legend-text">Current Airborne Position</span>
          </div>

          <span className="map-notice">Click any city node to view destination flight lore</span>
        </div>

        <div className="svg-map-wrapper">
          <svg
            viewBox="0 0 1020 520"
            className="flight-route-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Sri Lankan deep blue & gold gradient for unlocked route */}
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0B2D5C" />
                <stop offset="50%" stopColor="#E0A83B" />
                <stop offset="100%" stopColor="#FF6B4A" />
              </linearGradient>

              {/* Shadow filter for nodes */}
              <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.18" />
              </filter>
            </defs>

            {/* Subtle Stylized World Grid Lat/Long Lines */}
            <g className="map-grid-lines" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3,6" opacity="0.6">
              <line x1="40" y1="120" x2="980" y2="120" />
              <line x1="40" y1="240" x2="980" y2="240" />
              <line x1="40" y1="360" x2="980" y2="360" />
              <line x1="200" y1="50" x2="200" y2="470" />
              <line x1="400" y1="50" x2="400" y2="470" />
              <line x1="600" y1="50" x2="600" y2="470" />
              <line x1="800" y1="50" x2="800" y2="470" />
            </g>

            {/* Inactive Base Curved Flight Path */}
            <path
              d="M 120 340 C 180 290, 210 310, 250 300 C 310 280, 360 210, 420 220 C 490 230, 520 370, 590 360 C 670 350, 710 420, 770 410 C 830 400, 880 180, 920 130"
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="3.5"
              strokeDasharray="6,8"
              strokeLinecap="round"
            />

            {/* Active Completed Curved Flight Path */}
            <path
              d="M 120 340 C 180 290, 210 310, 250 300 C 310 280, 360 210, 420 220 C 490 230, 520 370, 590 360 C 670 350, 710 420, 770 410 C 830 400, 880 180, 920 130"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray="2000"
              strokeDashoffset={2000 - (2000 * (overallProgressPct / 100))}
              style={{ transition: 'stroke-dashoffset 1.4s ease-out' }}
            />

            {/* Route Waypoint Nodes */}
            {JOURNEY_MILESTONES.map((m, idx) => {
              const isUnlocked = unlockedCodes.includes(m.code);
              const isSelected = selectedMilestone?.code === m.code;

              return (
                <g
                  key={m.code}
                  className={`map-node-group ${isUnlocked ? 'unlocked' : 'locked'} ${
                    isSelected ? 'selected' : ''
                  }`}
                  onClick={() => triggerConfetti(m)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer pulse for unlocked nodes */}
                  {isUnlocked && (
                    <circle
                      cx={m.mapX}
                      cy={m.mapY}
                      r="22"
                      fill="#E0A83B"
                      fillOpacity="0.2"
                      className="pulse-circle"
                    />
                  )}

                  {/* Main Node Background Circle */}
                  <circle
                    cx={m.mapX}
                    cy={m.mapY}
                    r={isSelected ? '18' : '15'}
                    fill={isUnlocked ? '#0B2D5C' : '#FFFFFF'}
                    stroke={isUnlocked ? '#E0A83B' : '#94A3B8'}
                    strokeWidth={isSelected ? '3.5' : '2.5'}
                    filter="url(#nodeShadow)"
                  />

                  {/* Icon or Code */}
                  {isUnlocked ? (
                    <text
                      x={m.mapX}
                      y={m.mapY + 4}
                      textAnchor="middle"
                      fill="#FFD23F"
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="system-ui"
                    >
                      ✓
                    </text>
                  ) : (
                    <text
                      x={m.mapX}
                      y={m.mapY + 4}
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="9"
                      fontWeight="600"
                    >
                      🔒
                    </text>
                  )}

                  {/* City Label Below/Above */}
                  <g transform={`translate(${m.mapX}, ${m.mapY + 32})`}>
                    <rect
                      x="-48"
                      y="-12"
                      width="96"
                      height="24"
                      rx="12"
                      fill={isSelected ? '#0B2D5C' : '#FFFFFF'}
                      stroke={isSelected ? '#E0A83B' : '#E2E8F0'}
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={isSelected ? '#FFFFFF' : '#1E293B'}
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      {m.code} • {m.targetHours}h
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Cruising Plane Marker */}
            <g
              transform={`translate(${planePos.x}, ${planePos.y}) rotate(${planePos.angle})`}
              className="map-plane-g"
            >
              <circle r="16" fill="#FF6B4A" fillOpacity="0.25" className="plane-glow-ring" />
              <circle r="12" fill="#FF6B4A" stroke="#FFFFFF" strokeWidth="2" />
              <path
                d="M -5 -3 L 5 0 L -5 3 L -3 0 Z"
                fill="#FFFFFF"
                transform="rotate(0)"
              />
            </g>
          </svg>
        </div>
      </section>

      {/* Selected Milestone Detail Inspector */}
      {selectedMilestone && (
        <section className="milestone-inspector-card">
          <div className="inspector-badge-row">
            <div className="inspector-flag-box">
              <span className="inspector-flag-emoji">{selectedMilestone.flag}</span>
              <div>
                <h3 className="inspector-city-title">
                  {selectedMilestone.city}, {selectedMilestone.country}
                </h3>
                <span className="inspector-airport-name">{selectedMilestone.airport}</span>
              </div>
            </div>

            <div className="inspector-status-badge">
              {unlockedCodes.includes(selectedMilestone.code) ? (
                <span className="status-pill unlocked-pill">
                  <ShieldCheck size={14} /> Unlocked ({selectedMilestone.badge})
                </span>
              ) : (
                <span className="status-pill locked-pill">
                  <Lock size={14} /> Requires {selectedMilestone.targetHours} Study Hours
                </span>
              )}
            </div>
          </div>

          <div className="inspector-body">
            <p className="inspector-desc">{selectedMilestone.description}</p>
            <blockquote className="inspector-quote">"{selectedMilestone.quote}"</blockquote>
          </div>
        </section>
      )}

      {/* Milestones Cards Grid */}
      <section className="milestones-grid-section">
        <h2 className="milestones-section-heading">Milestone Flight Legs</h2>
        <div className="milestones-cards-grid">
          {JOURNEY_MILESTONES.map((m, idx) => {
            const isUnlocked = unlockedCodes.includes(m.code);
            const isNext = journey?.next_destination?.code === m.code;

            return (
              <div
                key={m.code}
                className={`milestone-destination-card ${isUnlocked ? 'is-unlocked' : ''} ${
                  isNext ? 'is-next' : ''
                }`}
                onClick={() => triggerConfetti(m)}
              >
                <div className="dest-card-header">
                  <span className="dest-flag-icon">{m.flag}</span>
                  <div className="dest-title-wrap">
                    <h4 className="dest-city-name">{m.city}</h4>
                    <span className="dest-airport-code">{m.code}</span>
                  </div>
                  <span className={`dest-status-icon ${isUnlocked ? 'icon-unlocked' : 'icon-locked'}`}>
                    {isUnlocked ? <CheckCircle2 size={18} /> : <Lock size={16} />}
                  </span>
                </div>

                <div className="dest-card-progress-bar">
                  <div
                    className="dest-card-progress-fill"
                    style={{
                      width: isUnlocked
                        ? '100%'
                        : `${Math.min(100, Math.max(0, (totalHours / (m.targetHours || 1)) * 100))}%`,
                    }}
                  />
                </div>

                <div className="dest-card-footer">
                  <span className="dest-hours-req">
                    <Clock size={12} /> {m.targetHours}h study target
                  </span>
                  <span className="dest-badge-title">{m.badge}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
