import React from 'react';
import { LayoutDashboard, BookOpen, BarChart3, Target, Compass, GraduationCap } from 'lucide-react';
import { USER_NAME } from '../../constants';

export default function Sidebar({ currentTab, onSelectTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'study-log', label: 'Study Log', icon: BookOpen },
    { id: 'monthly-report', label: 'Monthly Report', icon: BarChart3 },
    { id: 'journey', label: 'Journey', icon: Compass },
    { id: 'daily-goal', label: 'Daily Goal', icon: Target },
  ];

  return (
    <aside className="modern-sidebar">
      {/* Brand & Simple Logo */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">
          <GraduationCap size={22} className="logo-cap" />
        </div>
        <span className="brand-name">StudyPilot</span>
      </div>

      {/* Navigation Icons */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              aria-label={item.label}
            >
              <div className="nav-icon-wrapper">
                <Icon size={20} />
              </div>
              <span className="nav-btn-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Avatar at Bottom */}
      <div className="sidebar-footer">
        <div className="user-avatar-pill" title={USER_NAME}>
          <span className="avatar-emoji">👨‍💻</span>
          <div className="avatar-info">
            <span className="avatar-name">{USER_NAME}</span>
            <span className="avatar-status">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
