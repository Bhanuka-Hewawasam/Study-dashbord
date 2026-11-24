import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Flame,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reportsApi, statsApi } from '../../api/client';
import BoardingPassCard from '../cards/BoardingPassCard';
import AnimatedCounter from '../common/AnimatedCounter';

export default function MonthlyReportView() {
  // Current month in YYYY-MM format
  const now = new Date();
  const initialYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(initialYearMonth);
  const [report, setReport] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Donut chart colors: Pink, Yellow, Coral, Mint
  const DONUT_COLORS = ['#FF6B4A', '#F7A8D8', '#FFD23F', '#5ED3A8', '#8E98B0'];

  const fetchMonthlyReport = async (monthStr) => {
    try {
      setLoading(true);
      const [reportData, statsData] = await Promise.all([
        reportsApi.getMonthly(monthStr),
        statsApi.get().catch(() => null),
      ]);
      setReport(reportData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load monthly report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport(selectedMonth);
  }, [selectedMonth]);

  // Navigate to previous or next month
  const handleMonthChange = (offset) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const dateObj = new Date(y, m - 1 + offset, 1);
    const newYearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newYearMonth);
  };

  // CSV Exporter for this month's sessions
  const handleDownloadCSV = () => {
    if (!report || !report.sessions || report.sessions.length === 0) {
      alert('No study sessions found for this month to download.');
      return;
    }

    const headers = ['Date', 'Subject', 'Duration (Minutes)', 'Duration (Hours)', 'Notes'];
    const rows = report.sessions.map((s) => [
      s.date,
      `"${(s.subject || '').replace(/"/g, '""')}"`,
      s.duration_minutes,
      s.duration_hours,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `studypilot-report-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format month name display
  const monthTitle = report
    ? `${report.month_name} ${report.year}`
    : selectedMonth;

  // Safe metrics fallbacks
  const totalHours = report?.total_hours ?? 0;
  const activeDays = report?.active_days ?? 0;
  const totalDays = report?.total_days_in_month ?? 30;
  const avgMinutes = report?.average_minutes_per_active_day ?? 0;
  const goalHitPct = report?.goal_hit_percentage ?? 0;
  const changePct = report?.change_percentage ?? 0;
  const dailyGoal = report?.daily_goal_minutes ?? 180;
  const dailyData = report?.daily || [];
  const subjectBreakdown = report?.subject_breakdown || [];

  // Calendar Heatmap Color Calculator
  const getHeatmapColor = (minutes) => {
    if (!minutes || minutes <= 0) return '#F4F7FC';
    if (minutes < 45) return '#FFE8E2';
    if (minutes < 90) return '#FFC7B9';
    if (minutes < 180) return '#FF967F';
    return '#FF6B4A';
  };

  // Custom LineChart Tooltip
  const CustomLineTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="chart-tooltip-white">
          <div className="tooltip-date">{item.date}</div>
          <div className="tooltip-val">
            <span className="tooltip-mins">{item.minutes} min</span>
            <span className="tooltip-hrs">({(item.minutes / 60).toFixed(1)}h)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="monthly-report-container">
      {/* --------------------------------------------------------------------
          MONTH SELECTOR & CSV DOWNLOAD TOP BAR
          -------------------------------------------------------------------- */}
      <div className="report-header-card">
        <div className="month-picker-wrapper">
          <button
            className="month-nav-arrow"
            onClick={() => handleMonthChange(-1)}
            aria-label="Previous Month"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="month-title-wrap">
            <Calendar size={18} className="month-cal-icon" />
            <h1 className="report-month-title">{monthTitle}</h1>
          </div>

          <button
            className="month-nav-arrow"
            onClick={() => handleMonthChange(1)}
            aria-label="Next Month"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <button
          className="download-csv-btn"
          onClick={handleDownloadCSV}
          disabled={!report || (report.sessions && report.sessions.length === 0)}
          title="Download monthly sessions as CSV"
        >
          <Download size={16} />
          <span>Download CSV</span>
        </button>
      </div>

      {/* --------------------------------------------------------------------
          TOP ROW OF 4 WHITE CARDS
          -------------------------------------------------------------------- */}
      <div className="report-stats-grid">
        {/* 1. Total Hours */}
        <div className="report-stat-card">
          <div className="report-stat-top">
            <span className="report-stat-label">Total Hours</span>
            <Clock size={18} className="stat-icon-amber" />
          </div>
          <div className="report-stat-value">
            {loading ? '--' : totalHours} <span className="stat-value-unit">hrs</span>
          </div>
          <div className="report-stat-footer">
            {report?.total_minutes ?? 0} total minutes logged
          </div>
        </div>

        {/* 2. Active Days */}
        <div className="report-stat-card">
          <div className="report-stat-top">
            <span className="report-stat-label">Active Days</span>
            <Flame size={18} className="stat-icon-coral" />
          </div>
          <div className="report-stat-value">
            {loading ? '--' : activeDays}
            <span className="stat-value-sub">/{totalDays}</span>
          </div>
          <div className="report-stat-footer">
            {Math.round((activeDays / (totalDays || 1)) * 100)}% monthly attendance
          </div>
        </div>

        {/* 3. Avg per Active Day */}
        <div className="report-stat-card">
          <div className="report-stat-top">
            <span className="report-stat-label">Avg / Active Day</span>
            <Award size={18} className="stat-icon-yellow" />
          </div>
          <div className="report-stat-value">
            {loading ? '--' : avgMinutes} <span className="stat-value-unit">min</span>
          </div>
          <div className="report-stat-footer">
            {(avgMinutes / 60).toFixed(1)} hrs average focus
          </div>
        </div>

        {/* 4. Goal Hit % with Change Badge */}
        <div className="report-stat-card">
          <div className="report-stat-top">
            <span className="report-stat-label">Goal Hit %</span>
            <CheckCircle2 size={18} className="stat-icon-mint" />
          </div>
          <div className="report-stat-value">
            {loading ? '--' : goalHitPct}
            <span className="stat-value-unit">%</span>
          </div>
          <div className="report-stat-footer">
            <span className={`change-badge ${changePct >= 0 ? 'up' : 'down'}`}>
              {changePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {changePct >= 0 ? `+${changePct}%` : `${changePct}%`} vs last mo
            </span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          BIG LINE CHART CARD: DAILY MINUTES FOR THE WHOLE MONTH
          -------------------------------------------------------------------- */}
      <div className="report-chart-card">
        <div className="report-chart-header">
          <div>
            <h2 className="report-section-title">Daily Study Minutes</h2>
            <span className="report-section-subtitle">
              Daily minutes studied compared to daily goal ({dailyGoal}m)
            </span>
          </div>

          <div className="chart-legend-pill">
            <span className="legend-dot-coral" />
            <span>Study Minutes</span>
            <span className="legend-dot-goal" />
            <span>Daily Goal Target</span>
          </div>
        </div>

        <div className="recharts-line-wrapper">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyData} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="coralAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B4A" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#FF6B4A" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8E98B0', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8E98B0', fontSize: 12 }}
              />
              <Tooltip content={<CustomLineTooltip />} />
              <ReferenceLine
                y={dailyGoal}
                stroke="#BAC3D6"
                strokeDasharray="4 4"
                label={{
                  value: `Goal ${dailyGoal}m`,
                  fill: '#8E98B0',
                  fontSize: 11,
                  position: 'insideTopRight',
                }}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="#FF6B4A"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#coralAreaGradient)"
                activeDot={{ r: 6, fill: '#FF6B4A', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          BOTTOM ROW: DONUT CHART + CALENDAR HEATMAP
          -------------------------------------------------------------------- */}
      <div className="report-bottom-grid">
        {/* Subject Breakdown Donut Chart */}
        <div className="report-donut-card">
          <div className="donut-card-header">
            <h2 className="report-section-title">Subject Breakdown</h2>
            <span className="report-section-subtitle">Monthly time allocation</span>
          </div>

          {subjectBreakdown.length > 0 ? (
            <div className="donut-content-layout">
              <div className="donut-chart-box">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={subjectBreakdown}
                      dataKey="minutes"
                      nameKey="subject"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {subjectBreakdown.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [`${val} min`, name]}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #EDF2F9',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="donut-legend-list">
                {subjectBreakdown.map((s, idx) => (
                  <div key={idx} className="donut-legend-row">
                    <span
                      className="legend-color-chip"
                      style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                    />
                    <span className="legend-subject-title" title={s.subject}>
                      {s.subject}
                    </span>
                    <span className="legend-hours-text">
                      {(s.minutes / 60).toFixed(1)}h
                    </span>
                    <span className="legend-pct-text">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-donut-state">
              <PieIcon size={32} className="empty-donut-icon" />
              <span>No study hours recorded for this month.</span>
            </div>
          )}
        </div>

        {/* Calendar-Style Heatmap Grid */}
        <div className="report-heatmap-card">
          <div className="heatmap-card-header">
            <div>
              <h2 className="report-section-title">Study Heatmap</h2>
              <span className="report-section-subtitle">
                Consistency visualization for {report?.month_name || 'this month'}
              </span>
            </div>

            {/* Heatmap Legend */}
            <div className="heatmap-legend">
              <span className="legend-label">Less</span>
              <span className="heatmap-legend-cell" style={{ backgroundColor: '#F4F7FC' }} />
              <span className="heatmap-legend-cell" style={{ backgroundColor: '#FFE8E2' }} />
              <span className="heatmap-legend-cell" style={{ backgroundColor: '#FFC7B9' }} />
              <span className="heatmap-legend-cell" style={{ backgroundColor: '#FF967F' }} />
              <span className="heatmap-legend-cell" style={{ backgroundColor: '#FF6B4A' }} />
              <span className="legend-label">More</span>
            </div>
          </div>

          <div className="heatmap-calendar-grid">
            {dailyData.map((d) => (
              <div
                key={d.date}
                className="heatmap-day-square"
                style={{ backgroundColor: getHeatmapColor(d.minutes) }}
                title={`${d.date}: ${d.minutes} minutes`}
              >
                <span className="day-number">{d.day}</span>
                {d.minutes > 0 && <span className="day-mins-mini">{d.minutes}m</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
