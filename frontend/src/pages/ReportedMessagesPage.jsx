import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { Trash2, Flag, ArrowRight, UserX, X } from 'lucide-react';
import Badge from '../components/common/Badge';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

const ReportedMessagesPage = () => {
  const confirm = useConfirm();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReported = async () => {
    setLoading(true);
    try {
      const response = await client.get('/messages/reported');
      setMessages(response.data.messages || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load reported messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReported();
  }, []);

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete this message?',
      message: 'It will be permanently removed from the discussion for everyone. This cannot be undone.',
      confirmLabel: 'Delete Message',
    });
    if (!ok) return;
    try {
      await client.delete(`/messages/${id}`);
      toast.success('Message deleted.');
      fetchReported();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete message.');
    }
  };

  const handleDismiss = async (id) => {
    const ok = await confirm({
      title: 'Dismiss this report?',
      message: 'The message will stay in the discussion and no one will be blocked.',
      confirmLabel: 'Dismiss Report',
      danger: false,
    });
    if (!ok) return;
    try {
      const response = await client.delete(`/messages/${id}/reports`);
      toast.success(response.data.message || 'Report dismissed.');
      fetchReported();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dismiss report.');
    }
  };

  const handleBlockStudent = async (studentId, studentName) => {
    const ok = await confirm({
      title: `Block/unblock ${studentName}?`,
      message: 'This toggles their account status. While blocked, they cannot issue or reserve books, or post in discussions.',
      confirmLabel: 'Update Status',
    });
    if (!ok) return;
    try {
      const response = await client.put(`/students/block/${studentId}`);
      toast.success(response.data.message || 'Student status updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update student status.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Reported Messages</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Messages flagged by students across every book's public discussion. Staff messages cannot be reported.
        </p>
      </div>


      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>Loading reported messages...</p>
        ) : messages.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '30px' }}>No reported messages. All clear!</p>
        ) : (
          messages.map((message) => (
            <div key={message._id} style={{ border: '1px solid rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.06)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                    Reported user
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{message.authorName}</span>
                    <Badge type={message.authorRole === 'STUDENT' ? 'available' : 'admin'} label={message.authorRole.replace('_', ' ')} />
                    <Badge type="overdue" label={`${message.reportCount} report${message.reportCount === 1 ? '' : 's'}`} />
                  </div>
                  <p style={{ color: 'var(--text-main)', marginTop: '8px', whiteSpace: 'pre-wrap' }}>{message.content}</p>
                  {message.book && (
                    <Link
                      to={`/books/${message.book._id}`}
                      style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', textDecoration: 'none' }}
                    >
                      View in "{message.book.title}" <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleDismiss(message._id)}
                    className="btn btn-secondary btn-sm"
                    title="Keep the message, clear this report (false alarm)"
                  >
                    <X size={14} /> Dismiss Report
                  </button>
                  {message.authorRole === 'STUDENT' && (
                    <button
                      onClick={() => handleBlockStudent(message.authorId, message.authorName)}
                      className="btn btn-secondary btn-sm"
                      title="Block or unblock this student's account"
                    >
                      <UserX size={14} /> Block Student
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(message._id)}
                    className="btn btn-danger btn-sm"
                    title="Permanently remove this message from the chat"
                  >
                    <Trash2 size={14} /> Delete Message
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {message.reports.map((report, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <Flag size={13} color="#f87171" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>
                      <strong style={{ color: 'var(--text-main)' }}>
                        {report.reportedByName || 'Unknown'}
                      </strong>{' '}
                      <span style={{ color: 'var(--text-dim)' }}>({report.reportedByRole.replace('_', ' ')})</span>: {report.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportedMessagesPage;