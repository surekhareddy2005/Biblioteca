import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { Plus, Search, UserX, UserCheck } from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    email: '',
    password: '',
    branch: '',
    year: 1,
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await client.get('/students');
      const data = response.data;
      setStudents(Array.isArray(data.students) ? data.students : Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch student directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await client.post('/students', formData);
      setMessage('Student account registered successfully.');
      setIsModalOpen(false);
      setFormData({ name: '', rollNo: '', email: '', password: '', branch: '', year: 1 });
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create student.');
    }
  };

  const handleToggleBlock = async (id) => {
    setMessage('');
    setError('');
    try {
      const response = await client.put(`/students/block/${id}`);
      setMessage(response.data.message);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating student status.');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.branch?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Student Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Manage registered library members, account statuses, and profiles.
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={18} /> Register Student
        </button>
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
          placeholder="Search by Name, Roll No, Email, or Branch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
        />
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Email</th>
                <th>Branch & Year</th>
                <th>Active Fines</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Loading student records...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No student profiles found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.rollNo}</td>
                    <td style={{ color: 'var(--text-main)' }}>{s.email}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {s.branch} - Year {s.year}
                    </td>
                    <td style={{ fontWeight: 600, color: s.fine > 0 ? '#f87171' : 'var(--text-muted)' }}>
                      ₹{s.fine || 0}
                    </td>
                    <td>
                      <Badge
                        type={s.status === 'BLOCKED' ? 'blocked' : 'active'}
                        label={s.status === 'BLOCKED' ? 'Blocked' : 'Active'}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleBlock(s._id)}
                        className={`btn btn-sm ${s.status === 'BLOCKED' ? 'btn-success' : 'btn-danger'}`}
                        title={s.status === 'BLOCKED' ? 'Unblock Student' : 'Block Student'}
                      >
                        {s.status === 'BLOCKED' ? (
                          <>
                            <UserCheck size={14} /> Unblock
                          </>
                        ) : (
                          <>
                            <UserX size={14} /> Block
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Student">
        <form onSubmit={handleCreateStudent}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input
              type="text"
              className="input-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Roll Number</label>
              <input
                type="text"
                className="input-control"
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                className="input-control"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Branch / Department</label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Computer Science"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Study Year</label>
              <input
                type="number"
                min="1"
                max="5"
                className="input-control"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Initial Password</label>
            <input
              type="password"
              className="input-control"
              placeholder="Set student login password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Student
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentsPage;
