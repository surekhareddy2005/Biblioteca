import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Plus, Search, Edit3, Trash2, BookmarkPlus, MessageSquare, CheckCircle2 } from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { BOOK_BRANCH_OPTIONS } from '../constants/branches';

const BooksPage = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [reservedBookIds, setReservedBookIds] = useState(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    branch: '',
    category: '',
    totalCopies: 1,
    availableCopies: 1,
  });

  useEffect(() => {
    fetchBooks();
    if (role === 'STUDENT') {
      fetchMyReservations();
    }
  }, [role]);

  const fetchMyReservations = async () => {
    try {
      const response = await client.get('/reservations', { params: { limit: 500 } });
      const data = response.data;
      const list = Array.isArray(data.reservations) ? data.reservations : Array.isArray(data) ? data : [];
      const activeIds = list
        .filter((r) => {
          const studentId = r.student?._id || r.student;
          return studentId === user?.id && ['PENDING', 'NOTIFIED'].includes(r.status);
        })
        .map((r) => r.book?._id || r.book);
      setReservedBookIds(new Set(activeIds));
    } catch (err) {
      // Non-fatal: worst case the button just won't show "Reserved" yet.
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await client.get('/books');
      const data = response.data;
      setBooks(Array.isArray(data.books) ? data.books : Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to fetch book inventory.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (book = null) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        branch: book.branch || book.category || '',
        category: book.category || book.branch || '',
        totalCopies: book.totalCopies || 1,
        availableCopies: book.availableCopies || 1,
      });
    } else {
      setEditingBook(null);
      setFormData({ title: '', author: '', isbn: '', branch: '', category: '', totalCopies: 1, availableCopies: 1 });
    }
    setIsModalOpen(true);
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      branch: formData.branch || formData.category || 'General',
      category: formData.category || formData.branch || 'General',
    };

    try {
      if (editingBook) {
        await client.put(`/books/${editingBook._id}`, payload);
        toast.success('Book updated successfully.');
      } else {
        await client.post('/books', payload);
        toast.success('New book added to inventory.');
      }
      setIsModalOpen(false);
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving book.');
    }
  };

  const handleDeleteBook = async (id) => {
    const ok = await confirm({
      title: 'Delete this book?',
      message: 'This permanently removes the book from the catalog, including its issue/reservation history references. This cannot be undone.',
      confirmLabel: 'Delete Book',
    });
    if (!ok) return;
    try {
      await client.delete(`/books/${id}`);
      toast.success('Book deleted successfully.');
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete book.');
    }
  };

  const handleReserveBook = async (bookId) => {
    try {
      const response = await client.post('/reservations', { bookId, studentId: user.id });
      toast.success(response.data.message || 'Reservation placed successfully!');
      fetchBooks();
      fetchMyReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reserve book.');
      fetchMyReservations();
    }
  };

  const filteredBooks = books.filter((b) =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase()) ||
    b.branch?.toLowerCase().includes(search.toLowerCase()) ||
    b.category?.toLowerCase().includes(search.toLowerCase()) ||
    b.isbn?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Library Books Catalog</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Browse available books, track copies, and manage library inventory.
          </p>
        </div>

        {role !== 'STUDENT' && (
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            <Plus size={18} /> Add New Book
          </button>
        )}
      </div>


      {/* Search Input */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Search size={20} color="var(--text-muted)" />
        <input
          type="text"
          className="input-control"
          placeholder="Search by Title, Author, ISBN, or Branch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
        />
      </div>

      {/* Books Table / Grid */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Branch / Category</th>
                <th>ISBN</th>
                <th>Available / Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Loading library catalog...
                  </td>
                </tr>
              ) : filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No books found matching your query.
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr
                    key={book._id}
                    onClick={() => navigate(`/books/${book._id}`)}
                    style={{ cursor: 'pointer' }}
                    title="View discussion & reviews"
                  >
                    <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{book.title}</td>
                    <td style={{ color: 'var(--text-main)' }}>{book.author}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{book.branch || book.category || 'General'}</td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{book.isbn}</td>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ color: book.availableCopies > 0 ? '#10b981' : '#f87171' }}>
                        {book.availableCopies}
                      </span>{' '}
                      / {book.totalCopies}
                    </td>
                    <td>
                      <Badge
                        type={book.availableCopies > 0 ? 'available' : 'reserved'}
                        label={book.availableCopies > 0 ? 'In Stock' : 'Out of Stock'}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/books/${book._id}`)}
                          className="btn btn-secondary btn-sm"
                          title="Discussion & Reviews"
                        >
                          <MessageSquare size={15} />
                        </button>
                        {role !== 'STUDENT' ? (
                          <>
                            <button
                              onClick={() => handleOpenModal(book)}
                              className="btn btn-secondary btn-sm"
                              title="Edit Book"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book._id)}
                              className="btn btn-danger btn-sm"
                              title="Delete Book"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        ) : (
                          reservedBookIds.has(book._id) ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled
                              title="You already have an active reservation for this book"
                            >
                              <CheckCircle2 size={15} /> Reserved
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReserveBook(book._id)}
                              className="btn btn-primary btn-sm"
                              disabled={book.availableCopies > 0}
                              title={book.availableCopies > 0 ? 'Book is available in library' : 'Reserve next available copy'}
                            >
                              <BookmarkPlus size={15} /> Reserve Hold
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Book Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBook ? 'Edit Book Record' : 'Add New Book to Inventory'}>
        <form onSubmit={handleSaveBook}>
          <div className="input-group">
            <label className="input-label">Book Title</label>
            <input
              type="text"
              className="input-control"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Author Name</label>
            <input
              type="text"
              className="input-control"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">ISBN Code</label>
              <input
                type="text"
                className="input-control"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Branch / Department</label>
              <select
                className="input-control"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value, category: e.target.value })}
                required
              >
                <option value="" disabled>
                  Select Branch
                </option>
                {formData.branch && !BOOK_BRANCH_OPTIONS.includes(formData.branch) && (
                  <option value={formData.branch}>{formData.branch} (legacy)</option>
                )}
                {BOOK_BRANCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Total Copies</label>
              <input
                type="number"
                min="1"
                className="input-control"
                value={formData.totalCopies}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setFormData({ ...formData, totalCopies: val, availableCopies: editingBook ? formData.availableCopies : val });
                }}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Available Copies</label>
              <input
                type="number"
                min="0"
                className="input-control"
                value={formData.availableCopies}
                onChange={(e) => setFormData({ ...formData, availableCopies: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingBook ? 'Save Changes' : 'Create Book'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BooksPage;