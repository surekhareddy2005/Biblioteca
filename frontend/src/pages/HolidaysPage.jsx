import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/common/Modal';

const HolidaysPage = () => {
  const { role } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Current View Month & Year
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
  });

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const response = await client.get('/holidays');
      const data = response.data;
      setHolidays(Array.isArray(data.holidays) ? data.holidays : Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch library holidays.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await client.post('/holidays', formData);
      setMessage('Library holiday added to calendar.');
      setIsModalOpen(false);
      setFormData({ name: '', date: '', description: '' });
      fetchHolidays();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating holiday.');
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Remove this holiday from the calendar?')) return;
    setMessage('');
    setError('');

    try {
      await client.delete(`/holidays/${id}`);
      setMessage('Holiday removed successfully.');
      fetchHolidays();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting holiday.');
    }
  };

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Utility to convert Date / ISO string to YYYY-MM-DD key consistently
  const formatISOToDateKey = (dateInput) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const yr = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
    const da = String(d.getUTCDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  // Map holidays by date string YYYY-MM-DD
  const holidayMap = {};
  holidays.forEach((h) => {
    const key = formatISOToDateKey(h.date);
    if (key) {
      holidayMap[key] = h;
    }
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Library Holiday Calendar</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Holidays are automatically excluded when calculating book loan return due dates.
          </p>
        </div>

        {role === 'SUPER_ADMIN' && (
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={18} /> Add Holiday
          </button>
        )}
      </div>

      {/* Alerts */}
      {message && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem' }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f87171', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Calendar & Holidays List Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Monthly Calendar View */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>
              {monthNames[month]} {year}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={prevMonth} className="btn btn-secondary btn-sm"><ChevronLeft size={18} /></button>
              <button onClick={nextMonth} className="btn btn-secondary btn-sm"><ChevronRight size={18} /></button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
          </div>

          {/* Grid Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {/* Empty slots for month start padding */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} style={{ height: '44px', background: 'transparent' }} />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateObj = new Date(year, month, dayNum);
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isHoliday = !!holidayMap[dateStr];
              const isSunday = dateObj.getDay() === 0;

              return (
                <div
                  key={dayNum}
                  style={{
                    height: '44px',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isHoliday ? 'rgba(245, 112, 37, 0.25)' : isSunday ? 'rgba(18, 91, 159, 0.12)' : 'var(--bg-glass)',
                    border: isHoliday ? '1px solid #F57025' : isSunday ? '1px solid rgba(18, 91, 159, 0.3)' : '1px solid var(--border-color)',
                    color: isHoliday ? '#F57025' : 'var(--text-main)',
                    fontWeight: isHoliday ? 700 : 500,
                    fontSize: '0.88rem',
                    position: 'relative',
                  }}
                  title={isHoliday ? holidayMap[dateStr].name : ''}
                >
                  {dayNum}
                  {isHoliday && (
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F57025', position: 'absolute', bottom: '4px' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Holidays List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '16px' }}>Upcoming Holidays</h3>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading calendar dates...</p>
          ) : holidays.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No holiday closures added yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto' }}>
              {holidays.map((h) => (
                <div
                  key={h._id}
                  style={{
                    background: 'rgba(18, 91, 159, 0.1)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>{h.name}</span>
                    <span style={{ fontSize: '0.82rem', color: '#F57025', fontWeight: 600 }}>
                      📅 {new Date(h.date).toLocaleDateString(undefined, { timeZone: 'UTC', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    {h.description && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                        {h.description}
                      </span>
                    )}
                  </div>
                  {role === 'SUPER_ADMIN' && (
                    <button
                      onClick={() => handleDeleteHoliday(h._id)}
                      className="btn btn-danger btn-sm"
                      title="Remove Holiday"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Holiday Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Library Holiday">
        <form onSubmit={handleCreateHoliday}>
          <div className="input-group">
            <label className="input-label">Holiday Name / Occasion</label>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. National Day, Diwali, Annual Maintenance"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Date</label>
            <input
              type="date"
              className="input-control"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Description (Optional)</label>
            <textarea
              className="input-control"
              rows="3"
              placeholder="Additional details about library closure..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add to Calendar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HolidaysPage;
