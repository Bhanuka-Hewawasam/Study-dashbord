import React, { useState, useEffect } from 'react';
import { Play, Square, RotateCcw, Clock, Sparkles } from 'lucide-react';
import SubjectInput from './SubjectInput';

export default function StudyTimer({ onFillLogForm }) {
  // LocalStorage keys
  const STORAGE_ACTIVE = 'studypilot_timer_active';
  const STORAGE_START = 'studypilot_timer_start';
  const STORAGE_SUBJECT = 'studypilot_timer_subject';

  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timerSubject, setTimerSubject] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Restore active timer from localStorage on mount
  useEffect(() => {
    const savedActive = localStorage.getItem(STORAGE_ACTIVE) === 'true';
    const savedStart = parseInt(localStorage.getItem(STORAGE_START), 10);
    const savedSubject = localStorage.getItem(STORAGE_SUBJECT) || '';

    if (savedActive && savedStart && !isNaN(savedStart)) {
      setIsActive(true);
      setStartTime(savedStart);
      setTimerSubject(savedSubject);
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - savedStart) / 1000)));
    }
  }, []);

  // Timer interval ticker
  useEffect(() => {
    let interval = null;
    if (isActive && startTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, startTime]);

  // Start Timer handler
  const handleStart = () => {
    const now = Date.now();
    setIsActive(true);
    setStartTime(now);
    setElapsedSeconds(0);
    localStorage.setItem(STORAGE_ACTIVE, 'true');
    localStorage.setItem(STORAGE_START, String(now));
    localStorage.setItem(STORAGE_SUBJECT, timerSubject);
  };

  // Stop Timer handler: Does NOT save automatically; fills Log Study Time form!
  const handleStop = () => {
    const totalMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Send payload to fill the form in DashboardView
    if (onFillLogForm) {
      onFillLogForm({
        subject: timerSubject,
        hours: String(hours),
        minutes: String(minutes),
      });
    }

    // Reset state & clear localStorage
    setIsActive(false);
    setStartTime(null);
    setElapsedSeconds(0);
    localStorage.removeItem(STORAGE_ACTIVE);
    localStorage.removeItem(STORAGE_START);
    localStorage.removeItem(STORAGE_SUBJECT);
  };

  // Cancel / Reset timer
  const handleReset = () => {
    setIsActive(false);
    setStartTime(null);
    setElapsedSeconds(0);
    localStorage.removeItem(STORAGE_ACTIVE);
    localStorage.removeItem(STORAGE_START);
    localStorage.removeItem(STORAGE_SUBJECT);
  };

  // Format seconds as HH:MM:SS
  const formatTime = (totalSec) => {
    const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div className={`study-timer-widget ${isActive ? 'timer-active' : ''}`}>
      <div className="timer-top-row">
        <div className="timer-title-wrap">
          <Clock size={16} className={isActive ? 'icon-pulse-coral' : 'icon-muted'} />
          <span className="timer-heading">Live Study Timer</span>
          {isActive && <span className="timer-live-badge">RECORDING</span>}
        </div>

        {/* Big Digital Display */}
        <div className="timer-digits-display">
          <span className="timer-time-str">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      <div className="timer-controls-row">
        {/* Subject picker */}
        <div className="timer-subject-input-box">
          <SubjectInput
            value={timerSubject}
            onChange={(val) => {
              setTimerSubject(val);
              if (isActive) localStorage.setItem(STORAGE_SUBJECT, val);
            }}
            placeholder="Subject to study..."
            className="timer-combobox"
          />
        </div>

        {/* Action Buttons */}
        <div className="timer-buttons-wrap">
          {!isActive ? (
            <button
              type="button"
              className="timer-btn-start"
              onClick={handleStart}
              title="Start study timer"
            >
              <Play size={16} fill="white" />
              <span>Start Timer</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="timer-btn-stop"
                onClick={handleStop}
                title="Stop timer and fill the study log form"
              >
                <Square size={15} fill="white" />
                <span>Stop & Review</span>
              </button>
              <button
                type="button"
                className="timer-btn-reset"
                onClick={handleReset}
                title="Discard timer"
              >
                <RotateCcw size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
