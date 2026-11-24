import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import { flightsApi, statsApi, reportsApi } from '../../api/client';
import { USER_NAME } from '../../constants';
import SubjectInput from '../common/SubjectInput';
import StudyTimer from '../common/StudyTimer';

export default function DashboardView({ onNavigateToLog }) {
  // Telemetry & Flights State
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectPage, setSubjectPage] = useState(0);

  // Chart View Mode: "week" or "month"
  const [chartViewMode, setChartViewMode] = useState('week');

  // Form State for "Log Study Time"
  const todayStr = new Date().toISOString().split('T')[0];
  const [formDate, setFormDate] = useState(todayStr);
  const [formSubject, setFormSubject] = useState('');
  const [formHours, setFormHours] = useState('1');
  const [formMinutes, setFormMinutes] = useState('30');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Fetch telemetry, monthly report & flight data
  const fetchData = async () => {
    try {
      const [statsData, flightsData, monthData] = await Promise.all([
        statsApi.get().catch(() => null),
        flightsApi.getAll().catch(() => []),
        reportsApi.getMonthly().catch(() => null),
      ]);
      setStats(statsData);
      setFlights(flightsData || []);
      setMonthlyData(monthData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Callback from StudyTimer widget to fill form
  const handleFillFromTimer = ({ subject, hours, minutes }) => {
    if (subject) setFormSubject(subject);
    setFormHours(hours);
    setFormMinutes(minutes);
    setFormDate(todayStr);
    setFeedback({
      type: 'info',
      message: `Timer stopped (${hours}h ${minutes}m). Review details and click Save!`,
    });
  };

  // Compute sessions count per subject from flights list
  const subjectSessionCounts = React.useMemo(() => {
    const counts = {};
    flights.forEach((f) => {
      if (f.subject) {
        counts[f.subject] = (counts[f.subject] || 0) + 1;
      }
    });
    return counts;
  }, [flights]);

  // Derived subjects data with safe defaults
  const subjectBreakdown = stats?.subject_breakdown || [];
  const subjectsList = subjectBreakdown.length > 0
    ? subjectBreakdown.map((s) => ({
        name: s.subject,
        minutes: s.minutes || 0,
        percentage: s.percentage || 0,
        sessions: subjectSessionCounts[s.subject] || 1,
      }))
    : [
        { name: 'Java', minutes: 180, percentage: 40, sessions: 3 },
        { name: 'Database Systems', minutes: 120, percentage: 30, sessions: 2 },
        { name: 'Mobile App Development', minutes: 90, percentage: 20, sessions: 2 },
      ];

  // Subjects pagination (shows 3 at a time)
  const itemsPerPage = 3;
  const maxPage = Math.max(0, Math.ceil(subjectsList.length / itemsPerPage) - 1);
  const visibleSubjects = subjectsList.slice(
    subjectPage * itemsPerPage,
    (subjectPage + 1) * itemsPerPage
  );

  const handlePrevSubject = () => {
    setSubjectPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextSubject = () => {
    setSubjectPage((prev) => Math.min(maxPage, prev + 1));
  };

  // Weekly Goal completion percentage calculation
  const dailyGoal = stats?.daily_goal_minutes || 180;
  const weeklyGoalTarget = dailyGoal * 7;
  const weekMinutesTotal = (stats?.week_minutes || []).reduce((acc, d) => acc + (d.minutes || 0), 0);
  const weeklyCompletionRate = weeklyGoalTarget > 0
    ? Math.min(100, Math.round((weekMinutesTotal / weeklyGoalTarget) * 100))
    : 78;
  const displayWeeklyPercent = weeklyCompletionRate > 0 ? weeklyCompletionRate : 78;

  // 3-Segment colors for top 3 subjects
  const segmentColors = ['#F7A8D8', '#FFD23F', '#FF6B4A']; // Pink, Yellow, Coral

  const top3 = subjectsList.slice(0, 3);
  const top3TotalMinutes = top3.reduce((acc, s) => acc + s.minutes, 0) || 1;
  const top3Segments = top3.map((s, idx) => ({
    name: s.name,
    percent: Math.round((s.minutes / top3TotalMinutes) * 100),
    color: segmentColors[idx % segmentColors.length],
  }));

  // Week chart data (last 7 days)
  const weekChartData = (stats?.week_minutes || []).map((item) => ({
    day: item.day,
    date: item.date,
    minutes: item.minutes || 0,
    hours: ((item.minutes || 0) / 60).toFixed(1),
  }));

  const maxWeekMinutes = Math.max(...weekChartData.map((d) => d.minutes), 0);

  // Month chart data
  const monthChartData = (monthlyData?.daily || []).map((item) => ({
    day: item.day,
    date: item.date,
    minutes: item.minutes || 0,
    hours: ((item.minutes || 0) / 60).toFixed(1),
  }));

  // Handle Form Submission for "Log Study Time"
  const handleLogStudyTime = async (e) => {
    e.preventDefault();
    const hoursNum = parseInt(formHours) || 0;
    const minsNum = parseInt(formMinutes) || 0;
    const totalMins = hoursNum * 60 + minsNum;

    if (!formSubject.trim()) {
      setFeedback({ type: 'error', message: 'Please enter or select a subject name.' });
      return;
    }
    if (totalMins <= 0) {
      setFeedback({ type: 'error', message: 'Please log at least 1 minute of study time.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const targetDate = new Date(formDate + 'T12:00:00');
      const startTime = new Date(targetDate.getTime() - totalMins * 60000);

      await flightsApi.create({
        subject: formSubject.trim(),
        notes: formNotes.trim(),
        start_time: startTime.toISOString(),
        end_time: targetDate.toISOString(),
      });

      setFeedback({ type: 'success', message: `Logged ${totalMins} mins for ${formSubject}! 🎉` });
      setFormNotes('');
      // Auto-refresh dashboard stats, subjects, and charts without manual page reload!
      await fetchData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to log study session. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tooltips
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip-bubble">
          <span className="tooltip-value">{data.minutes}m</span>
          <span className="tooltip-sub">({data.hours} hrs)</span>
        </div>
      );
    }
    return null;
  };

  const CustomWhiteTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip-white">
          <div className="tooltip-date">{data.date || `Day ${data.day}`}</div>
          <div className="tooltip-val">
            <span className="tooltip-mins">{data.minutes} min</span>
            <span className="tooltip-hrs">({data.hours} hrs)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-grid">
      {/* ====================================================================
          CARD 1: STATISTIC CARD (TOP-LEFT)
          ==================================================================== */}
      <section className="dashboard-card statistic-card">
        <div className="stat-card-header">
          <div className="user-greeting-wrap">
            <span className="user-salutation">Welcome, {USER_NAME} 👋</span>
            <div className="weekly-goal-display">
              <span className="big-percent-stat">{displayWeeklyPercent}%</span>
              <span className="weekly-goal-label">of the weekly goal done</span>
            </div>
          </div>

          <div className="avatar-progress-container">
            <svg className="progress-ring-svg" viewBox="0 0 84 84">
              <circle
                className="progress-ring-track"
                cx="42"
                cy="42"
                r="36"
                strokeWidth="7"
              />
              <circle
                className="progress-ring-fill"
                cx="42"
                cy="42"
                r="36"
                strokeWidth="7"
                strokeDasharray={2 * Math.PI * 36}
                strokeDashoffset={2 * Math.PI * 36 * (1 - displayWeeklyPercent / 100)}
              />
            </svg>
            <div className="avatar-inside-ring">
              <span className="avatar-emoji-large">👨‍💻</span>
            </div>
          </div>
        </div>

        {/* 3-Segment Coloured Bar */}
        <div className="multi-segment-wrapper">
          <div className="segment-bar-track">
            {top3Segments.map((seg, idx) => (
              <div
                key={idx}
                className="segment-bar-fill"
                style={{
                  width: `${seg.percent}%`,
                  backgroundColor: seg.color,
                }}
                title={`${seg.name}: ${seg.percent}%`}
              />
            ))}
          </div>

          <div className="segment-legend-row">
            {top3Segments.map((seg, idx) => (
              <div key={idx} className="segment-legend-pill">
                <span
                  className="legend-color-dot"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="legend-subject-name">{seg.name}</span>
                <span className="legend-subject-percent">{seg.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Mini Stats */}
        <div className="mini-stats-grid">
          <div className="mini-stat-item">
            <span className="mini-stat-label">Today's minutes</span>
            <span className="mini-stat-value">
              {stats?.today_minutes ?? 0} <span className="mini-stat-unit">min</span>
            </span>
          </div>

          <div className="mini-stat-divider" />

          <div className="mini-stat-item">
            <span className="mini-stat-label">Streak</span>
            <span className="mini-stat-value">
              {stats?.streak_days ?? 0} <span className="mini-stat-unit">days</span>
            </span>
          </div>

          <div className="mini-stat-divider" />

          <div className="mini-stat-item">
            <span className="mini-stat-label">Total hours</span>
            <span className="mini-stat-value">
              {stats?.total_hours ?? 0} <span className="mini-stat-unit">hrs</span>
            </span>
          </div>
        </div>
      </section>

      {/* ====================================================================
          CARD 2: YOUR SUBJECTS (TOP-RIGHT HERO CORAL CARD)
          ==================================================================== */}
      <section className="dashboard-card subjects-hero-card">
        <div className="subjects-card-header">
          <div>
            <h2 className="subjects-card-title">Your Subjects</h2>
            <span className="subjects-card-subtitle">Active study targets</span>
          </div>

          <div className="subject-arrows-wrap">
            <button
              className="arrow-btn"
              onClick={handlePrevSubject}
              disabled={subjectPage === 0}
              aria-label="Previous subjects"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="arrow-btn"
              onClick={handleNextSubject}
              disabled={subjectPage >= maxPage}
              aria-label="Next subjects"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="sub-cards-container">
          {visibleSubjects.length > 0 ? (
            visibleSubjects.map((subj, idx) => (
              <div key={idx} className="subject-white-card">
                <div className="sub-card-top">
                  <span className="sub-card-name" title={subj.name}>
                    {subj.name}
                  </span>
                  <span className="session-count-pill">
                    {subj.sessions} {subj.sessions === 1 ? 'session' : 'sessions'}
                  </span>
                </div>

                <div className="sub-card-mid">
                  <span className="sub-card-percent-label">Share of target</span>
                  <span className="sub-card-percent-val">{subj.percentage}%</span>
                </div>

                <div className="thin-progress-track">
                  <div
                    className="thin-progress-fill"
                    style={{ width: `${Math.min(100, subj.percentage)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="subject-empty-state">
              <BookOpen size={24} />
              <span>No subjects logged yet. Log your first study session below!</span>
            </div>
          )}
        </div>
      </section>

      {/* ====================================================================
          CARD 3: STUDY PROGRESS CARD (BOTTOM-LEFT)
          ==================================================================== */}
      <section className="dashboard-card chart-card">
        <div className="chart-card-header">
          <div>
            <h2 className="chart-card-title">Study Progress</h2>
            <span className="chart-card-subtitle">
              {chartViewMode === 'week'
                ? 'Last 7 days study minutes'
                : `${monthlyData?.month_name || 'This month'} daily distribution`}
            </span>
          </div>

          <div className="week-selector-pill">
            <select
              value={chartViewMode}
              onChange={(e) => setChartViewMode(e.target.value)}
              aria-label="Select study progress view"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        <div className="recharts-wrapper">
          {chartViewMode === 'week' ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart
                data={weekChartData}
                margin={{ top: 25, right: 10, left: 10, bottom: 5 }}
              >
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8E98B0', fontSize: 13, fontWeight: 600 }}
                />
                <Tooltip
                  content={<CustomBarTooltip />}
                  cursor={{ fill: 'rgba(234, 241, 255, 0.4)' }}
                />
                <Bar dataKey="minutes" radius={[10, 10, 10, 10]} barSize={26}>
                  {weekChartData.map((entry, index) => {
                    const isHighest = entry.minutes > 0 && entry.minutes === maxWeekMinutes;
                    return (
                      <Cell
                        key={`bar-${index}`}
                        fill={isHighest ? '#FF6B4A' : '#E8EEF7'}
                        className="progress-bar-cell"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart
                data={monthChartData}
                margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="dashboardMonthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B4A" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#FF6B4A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8E98B0', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8E98B0', fontSize: 11 }}
                />
                <Tooltip content={<CustomWhiteTooltip />} />
                <ReferenceLine
                  y={dailyGoal}
                  stroke="#BAC3D6"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Goal',
                    fill: '#8E98B0',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="#FF6B4A"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#dashboardMonthGradient)"
                  activeDot={{ r: 5, fill: '#FF6B4A', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ====================================================================
          CARD 4: LOG STUDY TIME + OPTIONAL LIVE TIMER (BOTTOM-RIGHT)
          ==================================================================== */}
      <section className="dashboard-card log-time-hero-card">
        <div className="ambient-blob blob-1" />
        <div className="ambient-blob blob-2" />

        <div className="log-time-inner-box">
          {/* Optional Timer Widget (survives refresh, fills form on stop) */}
          <StudyTimer onFillLogForm={handleFillFromTimer} />

          <div className="log-divider-line" />

          <div className="log-time-header">
            <div>
              <h2 className="log-time-title">Log Study Time</h2>
              <span className="log-time-subtitle">Save manual study session</span>
            </div>
            <Sparkles size={18} className="sparkle-icon" />
          </div>

          {feedback && (
            <div className={`form-feedback ${feedback.type}`}>
              {feedback.type === 'success' && <Check size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleLogStudyTime} className="log-time-form">
            <div className="form-group">
              <label className="form-label">
                <Calendar size={14} className="label-icon" /> Date
              </label>
              <input
                type="date"
                className="modern-input"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
            </div>

            {/* Subject Autocomplete Combobox */}
            <div className="form-group">
              <label className="form-label">
                <BookOpen size={14} className="label-icon" /> Subject
              </label>
              <SubjectInput
                value={formSubject}
                onChange={setFormSubject}
                placeholder="Choose or type a subject..."
                required
              />
            </div>

            <div className="duration-inputs-row">
              <div className="form-group flex-1">
                <label className="form-label">
                  <Clock size={14} className="label-icon" /> Hours
                </label>
                <select
                  className="modern-input modern-select"
                  value={formHours}
                  onChange={(e) => setFormHours(e.target.value)}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((h) => (
                    <option key={h} value={h}>
                      {h} hr
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group flex-1">
                <label className="form-label">Minutes</label>
                <select
                  className="modern-input modern-select"
                  value={formMinutes}
                  onChange={(e) => setFormMinutes(e.target.value)}
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </div>

              <div className="send-btn-wrapper">
                <button
                  type="submit"
                  className="coral-send-btn"
                  disabled={isSubmitting}
                  title="Log Study Time"
                  aria-label="Submit study session"
                >
                  {isSubmitting ? (
                    <span className="spinner-dot" />
                  ) : (
                    <ArrowRight size={22} />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
