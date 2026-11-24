import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Plus, ChevronDown, X, Check } from 'lucide-react';
import { subjectsApi } from '../../api/client';
import { ACCENT_COLORS } from '../../constants';

export default function SubjectInput({
  value = '',
  onChange,
  onSelect,
  placeholder = 'e.g. Database Systems',
  allowClear = false,
  onClear,
  required = false,
  id,
  className = '',
  autoFocus = false,
  subjectOptions,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadedSubjects, setLoadedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const subjects = subjectOptions ?? loadedSubjects;

  // Load distinct subjects from backend
  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await subjectsApi.getAll();
      setLoadedSubjects(data || []);
    } catch (err) {
      console.error('Failed to load subjects list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subjectOptions === undefined) {
      loadSubjects();
    }
  }, [subjectOptions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter subjects based on user typed text
  const trimmedVal = value.trim().toLowerCase();
  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(trimmedVal)
  );

  // Does the exact typed subject already exist?
  const exactMatch = subjects.some(
    (s) => s.name.trim().toLowerCase() === trimmedVal
  );

  // Show "Add new subject" option if user has typed something that isn't an exact match
  const showAddNew = trimmedVal.length > 0 && !exactMatch;

  // Total selectable items (filtered + optional add new item)
  const totalItemsCount = filtered.length + (showAddNew ? 1 : 0);

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, totalItemsCount));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev <= 0 ? totalItemsCount - 1 : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        selectSubject(filtered[highlightedIndex].name);
      } else if (showAddNew && highlightedIndex === filtered.length) {
        selectSubject(value.trim());
      } else if (value.trim()) {
        selectSubject(value.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectSubject = (subjectName) => {
    if (onChange) onChange(subjectName);
    if (onSelect) onSelect(subjectName);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) inputRef.current.blur();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) onChange('');
    if (onClear) onClear();
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className={`subject-combobox-container ${className}`} ref={containerRef}>
      <div className="combobox-input-wrapper">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className="combobox-input modern-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            loadSubjects(); // Re-fetch on focus to catch newly added subjects
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          required={required}
          autoFocus={autoFocus}
          autoComplete="off"
        />

        <div className="combobox-actions">
          {allowClear && value && (
            <button
              type="button"
              className="combobox-clear-btn"
              onClick={handleClear}
              title="Clear subject"
              aria-label="Clear subject"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            className={`combobox-chevron-btn ${isOpen ? 'open' : ''}`}
            onClick={() => {
              setIsOpen((prev) => !prev);
              if (!isOpen && inputRef.current) inputRef.current.focus();
            }}
            tabIndex={-1}
            aria-label="Toggle subjects dropdown"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="combobox-dropdown-card">
          {loading && subjects.length === 0 ? (
            <div className="combobox-loading">
              <span className="spinner-dot" />
              <span>Loading subjects...</span>
            </div>
          ) : (
            <ul className="combobox-options-list" role="listbox">
              {filtered.map((item, idx) => {
                const isSelected = item.name.toLowerCase() === trimmedVal;
                const isHighlighted = idx === highlightedIndex;
                const dotColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];

                return (
                  <li
                    key={item.name}
                    className={`combobox-option-item ${isHighlighted ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectSubject(item.name)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="option-left">
                      <span
                        className="option-color-dot"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span className="option-name">{item.name}</span>
                    </div>

                    <div className="option-right">
                      <span className="option-count-pill">
                        {item.sessions_count} {item.sessions_count === 1 ? 'session' : 'sessions'}
                      </span>
                      {isSelected && <Check size={14} className="option-check-icon" />}
                    </div>
                  </li>
                );
              })}

              {/* "+ Add new subject" option */}
              {showAddNew && (
                <li
                  className={`combobox-add-new-item ${highlightedIndex === filtered.length ? 'highlighted' : ''}`}
                  onClick={() => selectSubject(value.trim())}
                  onMouseEnter={() => setHighlightedIndex(filtered.length)}
                  role="option"
                >
                  <Plus size={16} className="add-icon" />
                  <span>
                    Add <strong>"{value.trim()}"</strong> as a new subject
                  </span>
                </li>
              )}

              {filtered.length === 0 && !showAddNew && (
                <li className="combobox-empty-item">
                  <span>No subjects recorded yet. Type to add your first!</span>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
