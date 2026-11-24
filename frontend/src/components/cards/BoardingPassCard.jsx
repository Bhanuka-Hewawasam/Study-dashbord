import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Sparkles, Plane, Calendar, Clock, BookOpen, Flame, Award } from 'lucide-react';
import { USER_NAME } from '../../constants';

/**
 * BoardingPassCard
 * Styled as an authentic tear-off airline boarding pass ticket.
 * Summarizes the weekly study performance (hours, top subject, streak, goal days)
 * with Deep Blue (#0B2D5C), Gold (#E0A83B), and Coral accents, plus subtle peacock-feather SVG watermark.
 * Exports cleanly to PNG using `html-to-image`.
 */
export default function BoardingPassCard({ report, stats }) {
  const ticketRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  // Derive weekly metrics from stats or report
  const weekDays = stats?.week_minutes || [];
  const weekTotalMinutes = weekDays.reduce((acc, d) => acc + (d.minutes || 0), 0);
  const weekTotalHours = (weekTotalMinutes / 60.0).toFixed(1);

  // Top subject from stats breakdown
  const topSubject =
    stats?.subject_breakdown && stats.subject_breakdown.length > 0
      ? stats.subject_breakdown[0].subject
      : 'Core Studies';

  // Active streak
  const streakDays = stats?.streak_days ?? (report?.active_days || 0);

  // Daily goal hit count in current week
  const dailyGoalMins = report?.daily_goal_minutes || 180;
  const goalDaysHit = weekDays.filter((d) => (d.minutes || 0) >= dailyGoalMins).length;

  // Week range label (Last 7 days or current week)
  const now = new Date();
  const past7 = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const formatDateShort = (d) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekRangeLabel = `${formatDateShort(past7)} – ${formatDateShort(now)}, ${now.getFullYear()}`;

  // Download ticket as PNG
  const handleDownload = async () => {
    if (!ticketRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        backgroundColor: '#FFFFFF',
        quality: 1,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `studypilot-boarding-pass-${now.toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export boarding pass:', err);
      alert('Could not export image. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="boarding-pass-section">
      <div className="boarding-pass-section-header">
        <div>
          <h2 className="report-section-title">Weekly Boarding Pass</h2>
          <span className="report-section-subtitle">
            Your weekly study flight record—download and share your milestone!
          </span>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="download-pass-btn"
          title="Download Boarding Pass as PNG"
        >
          <Download size={16} />
          <span>{downloading ? 'Exporting...' : 'Download Pass'}</span>
        </button>
      </div>

      {/* The Printable Boarding Pass Ticket */}
      <div className="boarding-ticket-wrapper" ref={ticketRef}>
        {/* Main Flight Pass Body */}
        <div className="ticket-main-body">
          {/* Subtle Sri Lankan Peacock Feather Motif SVG Watermark */}
          <div className="peacock-watermark" aria-hidden="true">
            <svg viewBox="0 0 200 200" fill="none" className="peacock-svg">
              <path
                d="M100 20 C120 40, 160 80, 150 130 C140 170, 110 190, 100 190 C90 190, 60 170, 50 130 C40 80, 80 40, 100 20 Z"
                stroke="#0B2D5C"
                strokeWidth="2"
                strokeOpacity="0.08"
                fill="#E0A83B"
                fillOpacity="0.03"
              />
              <circle cx="100" cy="85" r="30" stroke="#0B2D5C" strokeWidth="1.5" strokeOpacity="0.08" />
              <circle cx="100" cy="85" r="18" fill="#0B2D5C" fillOpacity="0.06" />
              <circle cx="100" cy="85" r="8" fill="#E0A83B" fillOpacity="0.12" />
            </svg>
          </div>

          {/* Ticket Header (Deep Blue) */}
          <div className="ticket-header-navy">
            <div className="ticket-brand-left">
              <Plane size={18} className="ticket-plane-icon" />
              <span className="ticket-brand-text">STUDYPILOT AIRWAYS</span>
            </div>
            <div className="ticket-header-right">
              <span className="ticket-class-pill">FIRST CLASS STUDY LOG</span>
            </div>
          </div>

          {/* Passenger & Flight Info Row */}
          <div className="ticket-info-grid">
            <div className="ticket-field-block">
              <span className="ticket-label">PASSENGER NAME</span>
              <span className="ticket-val-bold">{USER_NAME.toUpperCase()}</span>
            </div>

            <div className="ticket-field-block">
              <span className="ticket-label">FLIGHT / ROUTE</span>
              <span className="ticket-val-bold">SP-2026 • CMB → MAA</span>
            </div>

            <div className="ticket-field-block">
              <span className="ticket-label">VALIDITY PERIOD</span>
              <span className="ticket-val-bold">{weekRangeLabel}</span>
            </div>

            <div className="ticket-field-block">
              <span className="ticket-label">STATUS</span>
              <span className="ticket-val-bold status-active-text">ACTIVE AIRBORNE</span>
            </div>
          </div>

          {/* Key Study Flight Metrics Row */}
          <div className="ticket-metrics-row">
            <div className="ticket-metric-box">
              <Clock size={16} className="metric-icon coral" />
              <div>
                <span className="metric-sub">WEEKLY STUDY HOURS</span>
                <span className="metric-big">{weekTotalHours}h</span>
              </div>
            </div>

            <div className="ticket-metric-box">
              <BookOpen size={16} className="metric-icon blue" />
              <div>
                <span className="metric-sub">PRIMARY SUBJECT</span>
                <span className="metric-big text-truncate" title={topSubject}>
                  {topSubject}
                </span>
              </div>
            </div>

            <div className="ticket-metric-box">
              <Flame size={16} className="metric-icon gold" />
              <div>
                <span className="metric-sub">STUDY STREAK</span>
                <span className="metric-big">{streakDays} Days</span>
              </div>
            </div>

            <div className="ticket-metric-box">
              <Award size={16} className="metric-icon mint" />
              <div>
                <span className="metric-sub">GOAL DAYS HIT</span>
                <span className="metric-big">{goalDaysHit} / 7</span>
              </div>
            </div>
          </div>

          {/* Bottom Barcode Strip */}
          <div className="ticket-bottom-barcode-row">
            <div className="barcode-graphic" aria-hidden="true">
              {/* Stylized Barcode SVG */}
              <svg width="240" height="34" viewBox="0 0 240 34" fill="#0B2D5C">
                <rect x="0" y="0" width="3" height="34" />
                <rect x="5" y="0" width="2" height="34" />
                <rect x="9" y="0" width="5" height="34" />
                <rect x="17" y="0" width="2" height="34" />
                <rect x="22" y="0" width="6" height="34" />
                <rect x="31" y="0" width="3" height="34" />
                <rect x="37" y="0" width="2" height="34" />
                <rect x="42" y="0" width="4" height="34" />
                <rect x="49" y="0" width="7" height="34" />
                <rect x="59" y="0" width="2" height="34" />
                <rect x="64" y="0" width="5" height="34" />
                <rect x="72" y="0" width="2" height="34" />
                <rect x="77" y="0" width="6" height="34" />
                <rect x="86" y="0" width="3" height="34" />
                <rect x="92" y="0" width="2" height="34" />
                <rect x="97" y="0" width="5" height="34" />
                <rect x="105" y="0" width="3" height="34" />
                <rect x="111" y="0" width="2" height="34" />
                <rect x="116" y="0" width="6" height="34" />
                <rect x="125" y="0" width="4" height="34" />
                <rect x="132" y="0" width="2" height="34" />
                <rect x="137" y="0" width="5" height="34" />
                <rect x="145" y="0" width="3" height="34" />
                <rect x="151" y="0" width="2" height="34" />
                <rect x="156" y="0" width="7" height="34" />
                <rect x="166" y="0" width="4" height="34" />
                <rect x="173" y="0" width="2" height="34" />
                <rect x="178" y="0" width="5" height="34" />
                <rect x="186" y="0" width="3" height="34" />
                <rect x="192" y="0" width="2" height="34" />
                <rect x="197" y="0" width="6" height="34" />
                <rect x="206" y="0" width="4" height="34" />
                <rect x="213" y="0" width="2" height="34" />
                <rect x="218" y="0" width="5" height="34" />
                <rect x="226" y="0" width="3" height="34" />
                <rect x="232" y="0" width="4" height="34" />
              </svg>
            </div>
            <span className="barcode-numeric">SP-LK-2026-9781440</span>
          </div>
        </div>

        {/* Perforated Divider Line with Cutout Notches */}
        <div className="ticket-tear-stub-divider">
          <div className="tear-notch top-notch" />
          <div className="tear-dashed-line" />
          <div className="tear-notch bottom-notch" />
        </div>

        {/* Tear-off Passenger Stub (Right side) */}
        <div className="ticket-passenger-stub">
          <div className="stub-header">
            <span className="stub-brand">PASSENGER STUB</span>
            <span className="stub-gate">GATE 01</span>
          </div>

          <div className="stub-content">
            <div className="stub-field">
              <span className="stub-label">PASSENGER</span>
              <span className="stub-val">{USER_NAME}</span>
            </div>
            <div className="stub-field">
              <span className="stub-label">WEEKLY FLIGHT HOURS</span>
              <span className="stub-val gold-accent">{weekTotalHours}h</span>
            </div>
            <div className="stub-field">
              <span className="stub-label">ORIGIN / DEST</span>
              <span className="stub-val">CMB → GLOBAL</span>
            </div>
            <div className="stub-field">
              <span className="stub-label">SEAT CLASS</span>
              <span className="stub-val">VIP STUDY</span>
            </div>
          </div>

          <div className="stub-barcode-mini" aria-hidden="true">
            <svg width="90" height="20" viewBox="0 0 90 20" fill="#0B2D5C">
              <rect x="0" y="0" width="2" height="20" />
              <rect x="4" y="0" width="3" height="20" />
              <rect x="9" y="0" width="1" height="20" />
              <rect x="12" y="0" width="4" height="20" />
              <rect x="18" y="0" width="2" height="20" />
              <rect x="22" y="0" width="3" height="20" />
              <rect x="27" y="0" width="1" height="20" />
              <rect x="30" y="0" width="4" height="20" />
              <rect x="36" y="0" width="2" height="20" />
              <rect x="40" y="0" width="3" height="20" />
              <rect x="45" y="0" width="1" height="20" />
              <rect x="48" y="0" width="4" height="20" />
              <rect x="54" y="0" width="2" height="20" />
              <rect x="58" y="0" width="3" height="20" />
              <rect x="63" y="0" width="1" height="20" />
              <rect x="66" y="0" width="4" height="20" />
              <rect x="72" y="0" width="2" height="20" />
              <rect x="76" y="0" width="3" height="20" />
              <rect x="81" y="0" width="1" height="20" />
              <rect x="84" y="0" width="4" height="20" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
