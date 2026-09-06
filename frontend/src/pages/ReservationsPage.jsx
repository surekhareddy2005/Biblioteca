import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { XCircle } from 'lucide-react';
import Badge from '../components/common/Badge';

const ReservationsPage = () => {
  const { role, user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await client.get('/reservations');
      const data = response.data;
      setReservations(Array.isArray(data.reservations) ? data.reservations : Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch reservation queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id) => {
    if (!window.confirm('Cancel this book reservation hold?')) return;
    setMessage('');
    setError('');

    try {
      const response = await client.put(`/reservations/cancel/${id}`);
      setMessage(response.data.message || 'Reservation cancelled.');
      fetchReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel reservation.');
    }
  };

  const displayedReservations = role === 'STUDENT'
    ? reservations.filter((r) => r.student?._id === user?.id || r.student === user?.id)
    : reservations;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>
          {role === 'STUDENT' ? 'My Book Reservations' : 'Book Reservation Queue'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Track pending holds, hold expiry notifications, and priority queues.
        </p>
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

      {/* Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Student</th>
                <th>Reservation Date</th>
                <th>Status</th>
                <th>Hold Expiry</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Loading reservation queue...
                  </td>
                </tr>
              ) : displayedReservations.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No reservation records found.
                  </td>
                </tr>
              ) : (
                displayedReservations.map((r) => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.book?.title || 'N/A'}</td>
                    <td>{r.student?.name || 'N/A'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(r.reservationDate).toLocaleDateString()}</td>
                    <td>
                      <Badge
                        type={r.status === 'NOTIFIED' ? 'available' : r.status === 'PENDING' ? 'reserved' : 'overdue'}
                        label={r.status}
                      />
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {r.expiryDate ? new Date(r.expiryDate).toLocaleString() : 'Pending notification'}
                    </td>
                    <td>
                      {r.status !== 'CANCELLED' && r.status !== 'EXPIRED' && (
                        <button
                          onClick={() => handleCancelReservation(r._id)}
                          className="btn btn-danger btn-sm"
                        >
                          <XCircle size={15} /> Cancel Hold
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReservationsPage;
