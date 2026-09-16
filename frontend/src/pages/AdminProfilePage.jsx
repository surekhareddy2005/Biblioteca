import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { UserCog, Save, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const AdminProfilePage = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await client.get(`/admins/${user.id}`);
        setProfile({ name: response.data.name, email: response.data.email });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load your profile.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchProfile();
  }, [user?.id]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await client.put(`/admins/${user.id}`, {
        name: profile.name,
        email: profile.email,
      });
      toast.success('Profile details updated successfully.');
      updateUser({ name: response.data.admin.name, email: response.data.admin.email });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwords.currentPassword || !passwords.newPassword) {
      toast.error('Please fill in your current and new password.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      await client.put(`/admins/${user.id}`, {
        password: passwords.newPassword,
        currentPassword: passwords.currentPassword,
      });
      toast.success('Password changed successfully.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ color: 'var(--text-muted)' }}>Loading your profile...</p>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Account Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Update your Super Admin name, email, and password.
        </p>
      </div>

      {/* Profile Details */}
      <form onSubmit={handleSaveDetails} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserCog size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Profile Details</h3>
        </div>

        <div className="input-group">
          <label className="input-label">Full Name</label>
          <input
            type="text"
            className="input-control"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Email Address</label>
          <input
            type="email"
            className="input-control"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            <Save size={15} /> Save Details
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Change Password</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswords((v) => !v)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem' }}
          >
            {showPasswords ? <EyeOff size={15} /> : <Eye size={15} />}
            {showPasswords ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className="input-group">
          <label className="input-label">Current Password</label>
          <input
            type={showPasswords ? 'text' : 'password'}
            className="input-control"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="input-group">
            <label className="input-label">New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className="input-control"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Confirm New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              className="input-control"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            <Save size={15} /> Update Password
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProfilePage;