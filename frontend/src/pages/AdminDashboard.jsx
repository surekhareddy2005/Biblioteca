import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import {
  BookOpen,
  ArrowRightLeft,
  Users,
  Clock,
  Plus,
} from 'lucide-react';
import Badge from '../components/common/Badge';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalIssues: 0,
    activeIssues: 0,
    totalStudents: 0,
    totalReservations: 0,
    totalHolidays: 0,
  });

  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [booksRes, issuesRes, studentsRes, reservationsRes, holidaysRes] = await Promise.allSettled([
        client.get('/books'),
        client.get('/issues'),
        client.get('/students'),
        client.get('/reservations'),
        client.get('/holidays'),
      ]);

      const booksData = booksRes.status === 'fulfilled' ? booksRes.value.data : [];
      const issuesData = issuesRes.status === 'fulfilled' ? issuesRes.value.data : [];
      const studentsData = studentsRes.status === 'fulfilled' ? studentsRes.value.data : [];
      const reservationsData = reservationsRes.status === 'fulfilled' ? reservationsRes.value.data : [];
      const holidaysData = holidaysRes.status === 'fulfilled' ? holidaysRes.value.data : [];

      const books = Array.isArray(booksData.books) ? booksData.books : Array.isArray(booksData) ? booksData : [];
      const issues = Array.isArray(issuesData.issues) ? issuesData.issues : Array.isArray(issuesData) ? issuesData : [];
      const students = Array.isArray(studentsData.students) ? studentsData.students : Array.isArray(studentsData) ? studentsData : [];
      const reservations = Array.isArray(reservationsData.reservations) ? reservationsData.reservations : Array.isArray(reservationsData) ? reservationsData : [];
      const holidays = Array.isArray(holidaysData.holidays) ? holidaysData.holidays : Array.isArray(holidaysData) ? holidaysData : [];

      const activeIssuesCount = issues.filter(i => !i.isReturned && i.status !== 'RETURNED').length;

      setStats({
        totalBooks: books.length,
        totalIssues: issues.length,
        activeIssues: activeIssuesCount,
        totalStudents: students.length,
        totalReservations: reservations.length,
        totalHolidays: holidays.length,
      });

      setRecentIssues(issues.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Book Titles', count: stats.totalBooks, icon: BookOpen, color: '#F57025', link: '/admin/books' },
    { title: 'Active Loans', count: stats.activeIssues, icon: ArrowRightLeft, color: '#125B9F', link: '/admin/issues' },
    { title: 'Registered Students', count: stats.totalStudents, icon: Users, color: '#10b981', link: '/admin/students' },
    { title: 'Pending Holds', count: stats.totalReservations, icon: Clock, color: '#F57025', link: '/admin/reservations' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Title & Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Real-time library metrics, active book loans, and quick management controls.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/admin/books" className="btn btn-primary btn-sm">
            <Plus size={16} /> Manage Books
          </Link>
          <Link to="/admin/issues" className="btn btn-secondary btn-sm">
            <ArrowRightLeft size={16} /> Issue Book
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link
              key={index}
              to={card.link}
              className="glass-panel glass-panel-hover"
              style={{
                padding: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textDecoration: 'none',
              }}
            >
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {card.title}
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                  {loading ? '...' : card.count}
                </div>
              </div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${card.color}20`,
                  border: `1px solid ${card.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={24} color={card.color} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Recent Issue Logs</h3>
          <Link to="/admin/issues" style={{ fontSize: '0.85rem', color: '#F57025', textDecoration: 'none', fontWeight: 600 }}>
            View All Issues &rarr;
          </Link>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Student</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentIssues.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                    No recent checkout records found.
                  </td>
                </tr>
              ) : (
                recentIssues.map((issue) => (
                  <tr key={issue._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{issue.book?.title || 'Unknown Book'}</td>
                    <td>{issue.student?.name || issue.student?.rollNo || 'Unknown Student'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(issue.issueDate).toLocaleDateString()}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(issue.dueDate).toLocaleDateString()}</td>
                    <td>
                      <Badge
                        type={issue.status === 'RETURNED' ? 'available' : new Date(issue.dueDate) < new Date() ? 'overdue' : 'issued'}
                        label={issue.status === 'RETURNED' ? 'Returned' : new Date(issue.dueDate) < new Date() ? 'Overdue' : 'Active Loan'}
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

export default AdminDashboard;
