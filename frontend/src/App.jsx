import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import DashboardView from './components/views/DashboardView';
import StudyLogView from './components/views/StudyLogView';
import MonthlyReportView from './components/views/MonthlyReportView';
import DailyGoalView from './components/views/DailyGoalView';
import JourneyView from './components/views/JourneyView';
import BackgroundClouds from './components/common/BackgroundClouds';
import './App.css';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigateToLog={() => setCurrentTab('study-log')}
            onNavigateToJourney={() => setCurrentTab('journey')}
          />
        );
      case 'study-log':
        return <StudyLogView />;
      case 'monthly-report':
        return <MonthlyReportView />;
      case 'journey':
        return <JourneyView />;
      case 'daily-goal':
        return <DailyGoalView />;
      default:
        return (
          <DashboardView
            onNavigateToLog={() => setCurrentTab('study-log')}
            onNavigateToJourney={() => setCurrentTab('journey')}
          />
        );
    }
  };

  return (
    <div className="app-shell">
      {/* Slow, subtle drifting background clouds */}
      <BackgroundClouds />

      {/* Big Rounded Main Dashboard Shell */}
      <div className="main-container">
        {/* Left Slim Sidebar */}
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Dynamic Content Panel */}
        <main className="main-content-area">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}
