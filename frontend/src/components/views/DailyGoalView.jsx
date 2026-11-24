import React, { useState, useEffect } from 'react';
import { Target, Check, Clock, Sparkles } from 'lucide-react';
import { flightPlanApi } from '../../api/client';

export default function DailyGoalView() {
  const [goalMinutes, setGoalMinutes] = useState(180);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    flightPlanApi
      .get()
      .then((data) => {
        if (data?.daily_goal_minutes) {
          setGoalMinutes(data.daily_goal_minutes);
        }
      })
      .catch((err) => console.error('Failed to load goal:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSavedSuccess(false);
      await flightPlanApi.update(Number(goalMinutes));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save daily goal.');
    } finally {
      setSaving(false);
    }
  };

  const hoursDisplay = (goalMinutes / 60).toFixed(1);
  const presets = [60, 120, 180, 240, 300];

  return (
    <div className="daily-goal-container">
      <div className="goal-card">
        <div className="goal-card-header">
          <div className="goal-icon-badge">
            <Target size={28} className="goal-target-icon" />
          </div>
          <h1 className="goal-title">Daily Study Goal</h1>
          <p className="goal-subtitle">
            Set your target study time per day. StudyPilot calculates your weekly completion rate and progress against this target.
          </p>
        </div>

        {savedSuccess && (
          <div className="goal-success-banner">
            <Check size={18} />
            <span>Daily goal updated to {goalMinutes} minutes ({hoursDisplay} hrs/day)!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="goal-form">
          {/* Big number display */}
          <div className="goal-metric-display">
            <span className="goal-big-num">{goalMinutes}</span>
            <span className="goal-unit-text">minutes / day</span>
            <span className="goal-hours-badge">{hoursDisplay} hours per day</span>
          </div>

          {/* Quick presets */}
          <div className="presets-row">
            {presets.map((preset) => (
              <button
                type="button"
                key={preset}
                className={`preset-pill ${goalMinutes === preset ? 'active' : ''}`}
                onClick={() => setGoalMinutes(preset)}
              >
                {preset / 60} hrs ({preset}m)
              </button>
            ))}
          </div>

          {/* Slider */}
          <div className="slider-wrapper">
            <input
              type="range"
              min="30"
              max="480"
              step="15"
              value={goalMinutes}
              onChange={(e) => setGoalMinutes(Number(e.target.value))}
              className="goal-slider"
            />
            <div className="slider-labels">
              <span>30 min</span>
              <span>4 hours</span>
              <span>8 hours</span>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="save-goal-btn"
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Daily Goal'}
          </button>
        </form>
      </div>
    </div>
  );
}
