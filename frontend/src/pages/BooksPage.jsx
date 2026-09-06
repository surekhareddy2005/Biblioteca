import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Plus, Search, Edit3, Trash2, BookmarkPlus } from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

const BooksPage = () => {
  const { role, user } = useAuth();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await client.get('/books');
      const data = response.data;
      setBooks(Array.isArray(data.books) ? data.books : Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch book inventory.');
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
    setError('');
    setMessage('');

    const payload = {
      ...formData,
      branch: formData.branch || formData.category || 'General',
      category: formData.category || formData.branch || 'General',
    };

    try {
      if (editingBook) {
        await client.put(`/books/${editingBook._id}`, payload);
        setMessage('Book updated successfully.');
      } else {
        await client.post('/books', payload);
        setMessage('New book added to inventory.');
      }
      setIsModalOpen(false);
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving book.');
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await client.delete(`/books/${id}`);
      setMessage('Book deleted successfully.');
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete book.');
    }
  };

  const handleReserveBook = async (bookId) => {
    try {
      const response = await client.post('/reservations', { bookId, studentId: user.id });
      setMessage(response.data.message || 'Reservation placed successfully!');
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reserve book.');
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

      {/* Notifications */}
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
                  <tr key={book._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{book.title}</td>
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
                      <div style={{ display: 'flex', gap: '8px' }}>
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
                          <button
                            onClick={() => handleReserveBook(book._id)}
                            className="btn btn-primary btn-sm"
                            disabled={book.availableCopies > 0}
                            title={book.availableCopies > 0 ? 'Book is available in library' : 'Reserve next available copy'}
                          >
                            <BookmarkPlus size={15} /> Reserve Hold
                          </button>
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
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Computer Science"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value, category: e.target.value })}
                required
              />
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
