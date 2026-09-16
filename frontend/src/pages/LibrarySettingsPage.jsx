import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { Settings2, IndianRupee, CalendarClock, Save } from 'lucide-react';

const LibrarySettingsPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [finePerDay, setFinePerDay] = useState(10);
  const [issueDurationDays, setIssueDurationDays] = useState(15);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await client.get('/settings');
        setFinePerDay(response.data.finePerDay);
        setIssueDurationDays(response.data.issueDurationDays);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load library settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    const numericFine = Number(finePerDay);
    const numericDays = Number(issueDurationDays);

    if (Number.isNaN(numericFine) || numericFine < 0) {
      toast.error('Fine per day must be a number of 0 or more.');
      return;
    }
    if (!Number.isInteger(numericDays) || numericDays < 1) {
      toast.error('Return period must be a whole number of at least 1 day.');
      return;
    }

    setSaving(true);
    try {
      const response = await client.put('/settings', {
        finePerDay: numericFine,
        issueDurationDays: numericDays,
      });
      toast.success(response.data.message || 'Library settings updated successfully.');
      setFinePerDay(response.data.settings.finePerDay);
      setIssueDurationDays(response.data.settings.issueDurationDays);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update library settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Loading library settings...</p>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Library Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Configure the overdue fine rate and how many days students get to return a book.
        </p>
      </div>

      <form onSubmit={handleSave} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings2 size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Loan Rules</h3>
        </div>

        <div className="input-group">
          <label className="input-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IndianRupee size={14} /> Fine per Overdue Day (₹)
            </span>
          </label>
          <input
            type="number"
            min="0"
            step="1"
            className="input-control"
            value={finePerDay}
            onChange={(e) => setFinePerDay(e.target.value)}
            required
          />
          <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '6px' }}>
            Charged to a student's fine balance for every day a book is returned past its due date.
          </p>
        </div>

        <div className="input-group">
          <label className="input-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CalendarClock size={14} /> Return Period (days)
            </span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            className="input-control"
            value={issueDurationDays}
            onChange={(e) => setIssueDurationDays(e.target.value)}
            required
          />
          <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '6px' }}>
            Number of days a student has to return a book after issuing it, before it's marked overdue.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            <Save size={15} /> Save Settings
          </button>
        </div>
      </form>

      <div className="glass-panel" style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Note: the return period only affects books issued after this change — books already checked out keep their original due date. The fine rate, however, is applied using whatever rate is active at the moment a book is returned, so changing it here affects overdue books that haven't been returned yet too.
      </div>
    </div>
  );
};

export default LibrarySettingsPage;