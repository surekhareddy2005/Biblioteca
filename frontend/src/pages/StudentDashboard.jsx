import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, Search, BookmarkCheck, IndianRupee, ChevronLeft, ChevronRight, History } from 'lucide-react';
import Badge from '../components/common/Badge';

const HISTORY_PAGE_SIZE = 5;

const StudentDashboard = () => {
  const { user } = useAuth();
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [history, setHistory] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [fine, setFine] = useState(0);
  const [loading, setLoading] = useState(true);

  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [issuesRes, resRes, profileRes] = await Promise.allSettled([
        client.get('/issues', { params: { limit: 500 } }),
        client.get('/reservations', { params: { limit: 500 } }),
        client.get('/students/me'),
      ]);

      if (issuesRes.status === 'fulfilled') {
        const issuesData = issuesRes.value.data;
        const allIssues = Array.isArray(issuesData.issues) ? issuesData.issues : Array.isArray(issuesData) ? issuesData : [];
        const myIssues = allIssues.filter(i => i.student?._id === user?.id || i.student === user?.id);

        setIssuedBooks(myIssues.filter(i => i.status !== 'RETURNED'));
        setHistory(
          myIssues
            .filter(i => i.status === 'RETURNED')
            .sort((a, b) => new Date(b.returnDate) - new Date(a.returnDate))
        );
      }

      if (resRes.status === 'fulfilled') {
        const resData = resRes.value.data;
        const allRes = Array.isArray(resData.reservations) ? resData.reservations : Array.isArray(resData) ? resData : [];
        const myRes = allRes.filter(r => (r.student?._id === user?.id || r.student === user?.id) && r.status !== 'CANCELLED');
        setReservations(myRes);
      }

      if (profileRes.status === 'fulfilled') {
        setFine(profileRes.value.data.fine || 0);
      }
    } catch (err) {
      console.error('Error loading student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return history;
    const q = historySearch.toLowerCase();
    return history.filter(
      (item) =>
        item.book?.title?.toLowerCase().includes(q) ||
        item.book?.author?.toLowerCase().includes(q)
    );
  }, [history, historySearch]);

  const totalHistoryPages = Math.max(1, Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE));
  const paginatedHistory = filteredHistory.slice(
    (historyPage - 1) * HISTORY_PAGE_SIZE,
    historyPage * HISTORY_PAGE_SIZE
  );

  // Reset back to page 1 whenever the search query changes, so a filtered
  // result set is never stuck on a page that no longer exists.
  useEffect(() => {
    setHistoryPage(1);
  }, [historySearch]);

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
            Roll No: <span style={{ color: '#F57025', fontWeight: 600 }}>{user?.rollNo}</span> | Access your issued books, due date reminders, and holds.
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
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Outstanding Fine</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: fine > 0 ? '#f87171' : 'var(--text-main)', marginTop: '4px' }}>
              ₹{fine}
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: fine > 0 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={22} color={fine > 0 ? '#f87171' : '#10b981'} />
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

      {/* Loan History */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="var(--accent-primary)" /> My Loan History
          </h3>
          <div style={{ position: 'relative', width: '260px', maxWidth: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="input-control"
              placeholder="Search returned books..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              style={{ paddingLeft: '34px' }}
            />
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Author</th>
                <th>Checkout Date</th>
                <th>Return Date</th>
                <th>Fine Charged</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Loading history...</td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    {historySearch ? 'No returned books match your search.' : 'You have no returned books yet.'}
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.book?.title || 'Unknown Title'}</td>
                    <td style={{ color: 'var(--text-main)' }}>{item.book?.author || 'N/A'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(item.issueDate).toLocaleDateString()}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '—'}</td>
                    <td style={{ color: item.fine > 0 ? '#f87171' : 'var(--text-muted)', fontWeight: item.fine > 0 ? 600 : 400 }}>
                      {item.fine > 0 ? `₹${item.fine}` : '—'}
                    </td>
                    <td>
                      <Badge
                        type={item.fine > 0 ? 'overdue' : 'available'}
                        label={item.fine > 0 ? 'Returned Late' : 'Returned On-Time'}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredHistory.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              Showing {(historyPage - 1) * HISTORY_PAGE_SIZE + 1}–{Math.min(historyPage * HISTORY_PAGE_SIZE, filteredHistory.length)} of {filteredHistory.length}
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                disabled={historyPage === 1}
              >
                <ChevronLeft size={15} />
              </button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Page {historyPage} of {totalHistoryPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                disabled={historyPage === totalHistoryPages}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;