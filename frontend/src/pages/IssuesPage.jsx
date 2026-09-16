import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { Plus, RotateCcw, CheckCircle } from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

const IssuesPage = () => {
  const confirm = useConfirm();
  const toast = useToast();
  const [issues, setIssues] = useState([]);
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);

  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedBook, setSelectedBook] = useState('');

  useEffect(() => {
    fetchIssuesData();
  }, []);

  const fetchIssuesData = async () => {
    setLoading(true);
    try {
      const [issuesRes, studentsRes, booksRes] = await Promise.allSettled([
        client.get('/issues'),
        client.get('/students'),
        client.get('/books'),
      ]);

      if (issuesRes.status === 'fulfilled') {
        const data = issuesRes.value.data;
        setIssues(Array.isArray(data.issues) ? data.issues : Array.isArray(data) ? data : []);
      }

      if (studentsRes.status === 'fulfilled') {
        const data = studentsRes.value.data;
        setStudents(Array.isArray(data.students) ? data.students : Array.isArray(data) ? data : []);
      }

      if (booksRes.status === 'fulfilled') {
        const data = booksRes.value.data;
        setBooks(Array.isArray(data.books) ? data.books : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      toast.error('Failed to load active issue records.');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();

    if (!selectedStudent || !selectedBook) {
      toast.error('Please select both a student and a book.');
      return;
    }

    try {
      const response = await client.post('/issues', {
        studentId: selectedStudent,
        bookId: selectedBook,
      });
      toast.success(response.data.message || 'Book issued successfully!');
      setIsModalOpen(false);
      setSelectedStudent('');
      setSelectedBook('');
      fetchIssuesData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error issuing book.');
    }
  };

  const handleReturnBook = async (issueId) => {
    const ok = await confirm({
      title: 'Process this return?',
      message: 'This marks the book as returned, restocks the copy, and calculates any overdue fine.',
      confirmLabel: 'Process Return',
      danger: false,
    });
    if (!ok) return;

    try {
      const response = await client.put(`/issues/${issueId}`);
      const fineMsg = response.data.fine > 0 ? ` (Overdue Fine: ₹${response.data.fine})` : '';
      toast.success(`Book returned successfully!${fineMsg}`);
      fetchIssuesData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process book return.');
    }
  };

  const availableBooks = books.filter((b) => b.availableCopies > 0);
  const activeStudents = students.filter((s) => s.status !== 'BLOCKED');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Book Checkout & Issue Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Issue books to students, process returns, and calculate overdue fines.
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={18} /> Issue Book to Student
        </button>
      </div>


      {/* Issues Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Fine</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Loading checkout records...
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No issue records found.
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{issue.book?.title || 'N/A'}</td>
                    <td>{issue.student?.name || 'N/A'}</td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{issue.student?.rollNo || 'N/A'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(issue.issueDate).toLocaleDateString()}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(issue.dueDate).toLocaleDateString()}</td>
                    <td>
                      <Badge
                        type={issue.status === 'RETURNED' ? 'available' : issue.displayStatus === 'OVERDUE' ? 'overdue' : 'issued'}
                        label={issue.status === 'RETURNED' ? 'Returned' : issue.displayStatus === 'OVERDUE' ? 'Overdue' : 'Active Loan'}
                      />
                    </td>
                    <td style={{ fontWeight: 600, color: issue.fine > 0 ? '#f87171' : 'var(--text-muted)' }}>
                      ₹{issue.fine || 0}
                    </td>
                    <td>
                      {issue.status !== 'RETURNED' ? (
                        <button
                          onClick={() => handleReturnBook(issue._id)}
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: '#F57025', color: '#F57025' }}
                        >
                          <RotateCcw size={15} /> Process Return
                        </button>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Closed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Book Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue Book to Student">
        <form onSubmit={handleIssueBook}>
          <div className="input-group">
            <label className="input-label">Select Student</label>
            <select
              className="input-control"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
            >
              <option value="">-- Select Active Student --</option>
              {activeStudents.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.rollNo || s.email})
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Select Book (In Stock)</label>
            <select
              className="input-control"
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              required
            >
              <option value="">-- Select Book --</option>
              {availableBooks.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.title} (Available: {b.availableCopies})
                </option>
              ))}
            </select>
          </div>

          <div style={{ background: 'rgba(18, 91, 159, 0.1)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            📌 Standard loan duration is 15 days. Automatic holiday adjustments are applied to due date calculations.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Issue Book
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IssuesPage;