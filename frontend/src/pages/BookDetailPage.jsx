import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowLeft,
  Send,
  Flag,
  Trash2,
  MessageSquare,
  Star,
  ShieldAlert,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import StarRating from '../components/common/StarRating';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

const POLL_INTERVAL_MS = 8000;

const BookDetailPage = () => {
  const { id } = useParams();
  const confirm = useConfirm();
  const toast = useToast();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const [book, setBook] = useState(null);
  const [loadingBook, setLoadingBook] = useState(true);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [reportingId, setReportingId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const chatEndRef = useRef(null);

  // Review state
  const [reviewSummary, setReviewSummary] = useState({
    reviews: [],
    averageRating: 0,
    totalReviews: 0,
    myReview: null,
  });
  const [myRating, setMyRating] = useState(0);
  const [myReviewText, setMyReviewText] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const fetchBook = useCallback(async () => {
    try {
      const response = await client.get(`/books/${id}`);
      setBook(response.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load book.');
    } finally {
      setLoadingBook(false);
    }
  }, [id]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await client.get(`/messages/book/${id}`);
      setMessages(response.data.messages || []);
    } catch (err) {
      // Silent on background polls; surface only on first load failure.
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await client.get(`/reviews/book/${id}`);
      setReviewSummary(response.data);
      if (response.data.myReview) {
        setMyRating(response.data.myReview.rating);
        setMyReviewText(response.data.myReview.reviewText || '');
      }
    } catch (err) {
      // Non-fatal
    }
  }, [id]);

  useEffect(() => {
    fetchBook();
    fetchMessages();
    fetchReviews();
  }, [fetchBook, fetchMessages, fetchReviews]);

  // Light polling so the "anyone can reply" chat feels live.
  useEffect(() => {
    const interval = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await client.post(`/messages/book/${id}`, { content: newMessage.trim() });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleReportSubmit = async (messageId) => {
    if (!reportReason.trim()) return;
    try {
      const response = await client.post(`/messages/${messageId}/report`, {
        reason: reportReason.trim(),
      });
      toast.success(response.data.message || 'Message reported.');
      setReportingId(null);
      setReportReason('');
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report message.');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const ok = await confirm({
      title: 'Delete this message?',
      message: 'It will be permanently removed from this discussion for everyone. This cannot be undone.',
      confirmLabel: 'Delete Message',
    });
    if (!ok) return;
    try {
      await client.delete(`/messages/${messageId}`);
      toast.success('Message deleted.');
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete message.');
    }
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!myRating) {
      toast.error('Please select a star rating before submitting.');
      return;
    }
    setSavingReview(true);
    try {
      const response = await client.post(`/reviews/book/${id}`, {
        rating: myRating,
        reviewText: myReviewText,
      });
      toast.success(response.data.message || 'Review saved.');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save review.');
    } finally {
      setSavingReview(false);
    }
  };

  if (loadingBook) {
    return <p style={{ color: 'var(--text-muted)' }}>Loading book details...</p>;
  }

  if (!book) {
    return <p style={{ color: 'var(--text-muted)' }}>Book not found.</p>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back + Title */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary btn-sm"
          style={{ marginBottom: '16px' }}
        >
          <ArrowLeft size={15} /> Back to Catalog
        </button>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.7rem', color: 'var(--text-main)' }}>{book.title}</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>by {book.author}</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
              <Badge type={book.availableCopies > 0 ? 'available' : 'reserved'} label={book.availableCopies > 0 ? 'In Stock' : 'Out of Stock'} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{book.branch}</span>
              <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: '0.85rem' }}>ISBN {book.isbn}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
              <StarRating value={Math.round(reviewSummary.averageRating)} />
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{reviewSummary.averageRating || '—'}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {reviewSummary.totalReviews} review{reviewSummary.totalReviews === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '24px' }}>
        {/* Public Discussion */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '480px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Public Discussion</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '-8px' }}>
            Visible to everyone. Anyone can reply here about this book.
          </p>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', paddingRight: '4px' }}>
            {messages.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '30px 0' }}>
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map((message) => {
                const isMine = message.authorId === user?.id;
                const reportedByMe =
                  isAdmin && message.reports
                    ? message.reports.some((r) => r.reportedBy === user?.id)
                    : false;

                return (
                  <div
                    key={message._id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '78%',
                        background: isMine
                          ? 'var(--gradient-primary)'
                          : message.reportCount > 0 && isAdmin
                          ? 'rgba(244, 63, 94, 0.08)'
                          : 'var(--bg-glass)',
                        border: isMine
                          ? 'none'
                          : `1px solid ${message.reportCount > 0 && isAdmin ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-color)'}`,
                        borderRadius: isMine
                          ? '14px 14px 4px 14px'
                          : '14px 14px 14px 4px',
                        padding: '10px 14px',
                      }}
                    >
                      {!isMine && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                            {message.authorName}
                          </span>
                          {isAdmin && message.reportCount > 0 && (
                            <Badge type="overdue" label={`${message.reportCount} report${message.reportCount === 1 ? '' : 's'}`} />
                          )}
                        </div>
                      )}

                      <p
                        style={{
                          color: isMine ? '#FFFFFF' : 'var(--text-main)',
                          fontSize: '0.92rem',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {message.content}
                      </p>
                    </div>

                    <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: '3px', padding: '0 4px' }}>
                      {isMine ? 'You · ' : ''}
                      {new Date(message.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '2px', padding: '0 4px', alignItems: 'center' }}>
                      {!isMine && !reportedByMe && message.authorRole === 'STUDENT' && (
                        <button
                          onClick={() => {
                            setReportingId(reportingId === message._id ? null : message._id);
                            setReportReason('');
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          title="Report this message"
                        >
                          <Flag size={12} /> Report
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteMessage(message._id)}
                          style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          title="Delete this message"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                    </div>

                    {reportingId === message._id && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', width: '100%', maxWidth: '78%' }}>
                        <input
                          type="text"
                          className="input-control"
                          placeholder="Why are you reporting this message?"
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                        />
                        <button
                          onClick={() => handleReportSubmit(message._id)}
                          className="btn btn-danger btn-sm"
                          disabled={!reportReason.trim()}
                        >
                          Submit
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <input
              type="text"
              className="input-control"
              placeholder="Write a public reply about this book..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              maxLength={1000}
            />
            <button type="submit" className="btn btn-primary" disabled={sending || !newMessage.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Ratings & Reviews */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={20} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Ratings & Reviews</h3>
          </div>

          {role === 'STUDENT' && (
            <form onSubmit={handleSaveReview} className="glass-panel" style={{ padding: '16px', background: 'var(--bg-glass)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '10px' }}>
                {reviewSummary.myReview ? 'Update your review' : 'Rate & review this book'}
              </p>
              <StarRating value={myRating} onChange={setMyRating} size={24} />
              <textarea
                className="input-control"
                placeholder="Share your thoughts about this book (optional)..."
                value={myReviewText}
                onChange={(e) => setMyReviewText(e.target.value)}
                rows={3}
                maxLength={2000}
                style={{ marginTop: '10px', resize: 'vertical' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '10px' }} disabled={savingReview}>
                {reviewSummary.myReview ? 'Update Review' : 'Submit Review'}
              </button>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '8px' }}>
                Only students who have issued this book can review it.
              </p>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '360px' }}>
            {reviewSummary.reviews.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>
                No reviews yet.
              </p>
            ) : (
              reviewSummary.reviews.map((review) => (
                <div key={review._id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {review.student?.name || 'Student'}{' '}
                      <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>
                        {review.student?.rollNo ? `(${review.student.rollNo})` : ''}
                      </span>
                    </span>
                    <StarRating value={review.rating} size={14} />
                  </div>
                  {review.reviewText && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>{review.reviewText}</p>
                  )}
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '6px' }}>
                    {new Date(review.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
          <ShieldAlert size={15} />
          Reported messages across all books can be reviewed from the Reported Messages page in the sidebar.
        </div>
      )}
    </div>
  );
};

export default BookDetailPage;