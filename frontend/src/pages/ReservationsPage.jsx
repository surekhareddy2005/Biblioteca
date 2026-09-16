import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { XCircle } from 'lucide-react';
import Badge from '../components/common/Badge';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

const ReservationsPage = () => {
  const { role, user } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await client.get('/reservations', { params: { sort: 'newest', limit: 500 } });
      const data = response.data;
      setReservations(Array.isArray(data.reservations) ? data.reservations : Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to fetch reservation queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id) => {
    const ok = await confirm({
      title: 'Cancel this reservation hold?',
      message: 'The hold will be released and the next student in the queue (if any) can be notified when a copy frees up.',
      confirmLabel: 'Cancel Hold',
    });
    if (!ok) return;

    try {
      const response = await client.put(`/reservations/cancel/${id}`);
      toast.success(response.data.message || 'Reservation cancelled.');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation.');
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
                      {r.expiryDate
                        ? new Date(r.expiryDate).toLocaleString()
                        : r.status === 'CANCELLED'
                        ? 'Cancelled before notification'
                        : r.status === 'PENDING'
                        ? 'Waiting in queue'
                        : '—'}
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