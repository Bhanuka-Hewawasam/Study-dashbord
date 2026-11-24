import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Filter,
  RotateCcw,
  AlertCircle,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { flightsApi } from '../../api/client';
import SubjectInput from '../common/SubjectInput';

export default function StudyLogView() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterSubject, setFilterSubject] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State (10 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Edit Modal State
  const [editingSession, setEditingSession] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editHours, setEditHours] = useState('1');
  const [editMinutes, setEditMinutes] = useState('0');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch filtered study sessions from backend
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterSubject.trim()) params.subject = filterSubject.trim();
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await flightsApi.getAll(params);
      setFlights(data || []);
      setCurrentPage(1); // Reset to page 1 on filter
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [filterSubject, dateFrom, dateTo, searchQuery]);

  // Reset all filters
  const handleResetFilters = () => {
    setFilterSubject('');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  };

  const hasActiveFilters = Boolean(
    filterSubject || dateFrom || dateTo || searchQuery
  );

  // Calculate filtered totals
  const totalFilteredMinutes = flights.reduce(
    (acc, f) => acc + (f.duration_minutes || 0),
    0
  );
  const totalFilteredHours = (totalFilteredMinutes / 60.0).toFixed(1);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(flights.length / itemsPerPage));
  const paginatedFlights = flights.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Delete session handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study session?')) return;
    try {
      await flightsApi.delete(id);
      setFlights((prev) => prev.filter((f) => f.id !== id));
      showToast('Study session deleted.');
    } catch (err) {
      alert('Failed to delete study session.');
    }
  };

  // Open Edit Modal
  const openEditModal = (flight) => {
    setEditingSession(flight);
    setEditSubject(flight.subject || '');
    setEditNotes(flight.notes || '');

    const d = new Date(flight.start_time);
    const dateStr = d.toISOString().split('T')[0];
    setEditDate(dateStr);

    const totalMins = flight.duration_minutes || 0;
    setEditHours(String(Math.floor(totalMins / 60)));
    setEditMinutes(String(totalMins % 60));
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSession) return;

    const hoursNum = parseInt(editHours, 10) || 0;
    const minsNum = parseInt(editMinutes, 10) || 0;
    const totalMins = hoursNum * 60 + minsNum;

    if (!editSubject.trim()) {
      alert('Please provide a subject name.');
      return;
    }
    if (totalMins <= 0) {
      alert('Duration must be greater than 0 minutes.');
      return;
    }

    try {
      setIsSavingEdit(true);
      const targetDate = new Date(editDate + 'T12:00:00');
      const startTime = new Date(targetDate.getTime() - totalMins * 60000);

      const updated = await flightsApi.update(editingSession.id, {
        subject: editSubject.trim(),
        notes: editNotes.trim(),
        start_time: startTime.toISOString(),
        end_time: targetDate.toISOString(),
      });

      setFlights((prev) =>
        prev.map((f) => (f.id === editingSession.id ? updated : f))
      );
      setEditingSession(null);
      showToast('Study session updated successfully! ✨');
    } catch (err) {
      alert('Failed to update session.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="study-log-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`app-floating-toast ${toast.type}`}>
          <Check size={16} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner Card: Total Filtered Time & Controls */}
      <div className="study-log-header-card">
        <div className="log-header-left">
          <h1 className="log-page-title">Study Log</h1>
          <span className="log-page-subtitle">
            All recorded study sessions ({flights.length})
          </span>
        </div>

        {/* Filtered Total Summary Pill */}
        <div className="filtered-summary-banner">
          <Clock size={16} className="summary-clock-icon" />
          <div className="summary-text-wrap">
            <span className="summary-label">Total Time in Results:</span>
            <span className="summary-value">
              {totalFilteredHours} hrs ({totalFilteredMinutes} min)
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar Card */}
      <div className="log-filters-card">
        <div className="filter-item-search">
          <Search size={15} className="filter-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search notes or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Subject Filter (using SubjectInput combobox!) */}
        <div className="filter-item-subject">
          <SubjectInput
            value={filterSubject}
            onChange={setFilterSubject}
            placeholder="All Subjects (filter...)"
            allowClear
            onClear={() => setFilterSubject('')}
            className="filter-subject-input"
          />
        </div>

        {/* Date From */}
        <div className="filter-item-date">
          <span className="date-filter-label">From:</span>
          <input
            type="date"
            className="date-input-field"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        {/* Date To */}
        <div className="filter-item-date">
          <span className="date-filter-label">To:</span>
          <input
            type="date"
            className="date-input-field"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            className="reset-filters-btn"
            onClick={handleResetFilters}
            title="Clear all filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Sessions Table Card */}
      <div className="study-log-table-card">
        {loading ? (
          <div className="log-loading-state">
            <span className="loading-spinner" />
            <span>Loading study sessions...</span>
          </div>
        ) : paginatedFlights.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Notes</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFlights.map((flight) => (
                    <tr key={flight.id}>
                      <td>
                        <div className="subject-cell">
                          <span className="subject-badge-pill" />
                          <span className="subject-name-text">{flight.subject}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <Calendar size={14} className="cell-icon" />
                          <span>{formatDate(flight.start_time)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="duration-cell">
                          <Clock size={14} className="cell-icon" />
                          <span className="duration-bold">
                            {flight.duration_minutes} min
                          </span>
                          <span className="duration-hours">
                            ({(flight.duration_minutes / 60).toFixed(1)}h)
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="notes-text" title={flight.notes}>
                          {flight.notes || <span className="no-notes">—</span>}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions-group">
                          <button
                            type="button"
                            className="edit-row-btn"
                            onClick={() => openEditModal(flight)}
                            title="Edit session"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => handleDelete(flight.id)}
                            title="Delete session"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="table-pagination-bar">
                <span className="pagination-info">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, flights.length)} of {flights.length}
                </span>

                <div className="pagination-buttons">
                  <button
                    type="button"
                    className="pagination-arrow-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span className="page-number-display">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    className="pagination-arrow-btn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-log-state">
            <AlertCircle size={32} className="empty-icon" />
            <h3>No study sessions found</h3>
            <p>
              {hasActiveFilters
                ? 'Try adjusting your subject or date filters to find matching sessions.'
                : 'Log your first study session from the Dashboard to see it listed here.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="clear-filters-btn"
                onClick={handleResetFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="modal-backdrop" onClick={() => setEditingSession(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Study Session</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingSession(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} className="label-icon" /> Date
                </label>
                <input
                  type="date"
                  className="modern-input"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <BookOpen size={14} className="label-icon" /> Subject
                </label>
                <SubjectInput
                  value={editSubject}
                  onChange={setEditSubject}
                  placeholder="Select or enter subject..."
                  required
                />
              </div>

              <div className="duration-inputs-row">
                <div className="form-group flex-1">
                  <label className="form-label">
                    <Clock size={14} className="label-icon" /> Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    className="modern-input"
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className="modern-input"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="modern-input modern-textarea"
                  rows="3"
                  placeholder="What topics did you cover?"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setEditingSession(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-save-btn"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
