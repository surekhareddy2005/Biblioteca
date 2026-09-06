import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, Search, BookmarkCheck } from 'lucide-react';
import Badge from '../components/common/Badge';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [issuesRes, resRes] = await Promise.allSettled([
        client.get('/issues'),
        client.get('/reservations'),
      ]);

      if (issuesRes.status === 'fulfilled') {
        const issuesData = issuesRes.value.data;
        const allIssues = Array.isArray(issuesData.issues) ? issuesData.issues : Array.isArray(issuesData) ? issuesData : [];
        const myIssues = allIssues.filter(i => (i.student?._id === user?.id || i.student === user?.id) && !i.isReturned && i.status !== 'RETURNED');
        setIssuedBooks(myIssues);
      }

      if (resRes.status === 'fulfilled') {
        const resData = resRes.value.data;
        const allRes = Array.isArray(resData.reservations) ? resData.reservations : Array.isArray(resData) ? resData : [];
        const myRes = allRes.filter(r => (r.student?._id === user?.id || r.student === user?.id) && r.status !== 'CANCELLED');
        setReservations(myRes);
      }
    } catch (err) {
      console.error('Error loading student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(245, 112, 37, 0.15) 0%, rgba(18, 91, 159, 0.2) 100%)',
          border: '1px solid var(--border-glow)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
            Roll No: <span style={{ color: '#F57025', fontWeight: 600 }}>{user?.rollNo || user?.email}</span> | Access your issued books, due date reminders, and holds.
          </p>
        </div>

        <Link to="/student/books" className="btn btn-primary">
          <Search size={18} /> Browse Book Catalog
        </Link>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Currently Issued</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{issuedBooks.length} / 3</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(245, 112, 37, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} color="#F57025" />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Holds</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{reservations.length}</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(18, 91, 159, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookmarkCheck size={22} color="#125B9F" />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Account Status</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981', marginTop: '8px' }}>Active Member</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Badge type="available" label="Active" />
          </div>
        </div>
      </div>

      {/* Currently Issued Books */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '16px' }}>My Currently Issued Books</h3>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Author</th>
                <th>Checkout Date</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Loading books...</td>
                </tr>
              ) : issuedBooks.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    You currently have no checked-out books.
                  </td>
                </tr>
              ) : (
                issuedBooks.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.book?.title || 'Unknown Title'}</td>
                    <td style={{ color: 'var(--text-main)' }}>{item.book?.author || 'N/A'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(item.issueDate).toLocaleDateString()}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(item.dueDate).toLocaleDateString()}</td>
                    <td>
                      <Badge
                        type={new Date(item.dueDate) < new Date() ? 'overdue' : 'issued'}
                        label={new Date(item.dueDate) < new Date() ? 'Overdue' : 'Active Loan'}
                      />
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

export default StudentDashboard;
