import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, ShieldCheck, GraduationCap, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { BRANCH_OPTIONS } from '../constants/branches';

const Login = () => {
  const navigate = useNavigate();
  const { login, registerUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('STUDENT'); // ADMIN or STUDENT
  const [isRegistering, setIsRegistering] = useState(false); // Sign in vs Sign up

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN'); // SUPER_ADMIN or ADMIN for staff login
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [year, setYear] = useState('1');

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    if (isRegistering) {
      if (!name || !rollNo || !email || !password || !branch || !year) {
        toast.error('Please fill in all fields to complete registration.');
        setIsSubmitting(false);
        return;
      }

      const result = await registerUser({
        name,
        rollNo,
        email,
        password,
        branch,
        year: Number(year),
      });

      setIsSubmitting(false);

      if (result.success) {
        navigate('/student/dashboard');
      } else {
        toast.error(result.error);
      }
    } else {
      if (!email || !password) {
        toast.error('Please fill in all credentials.');
        setIsSubmitting(false);
        return;
      }

      const selectedRole = activeTab === 'STUDENT' ? 'STUDENT' : role;
      const result = await login(email, password, selectedRole);
      setIsSubmitting(false);

      if (result.success) {
        if (result.user.role === 'STUDENT') {
          navigate('/student/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        toast.error(result.error);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-dark)',
        color: 'var(--text-main)',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Ambient Glows */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '15%',
          width: '420px',
          height: '420px',
          background: 'rgba(245, 112, 37, 0.12)',
          filter: 'blur(120px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '15%',
          width: '420px',
          height: '420px',
          background: 'rgba(18, 91, 159, 0.18)',
          filter: 'blur(120px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '36px',
          zIndex: 10,
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #F57025 0%, #125B9F 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(245, 112, 37, 0.4)',
              marginBottom: '12px',
            }}
          >
            <BookOpen size={28} color="#FFFFFF" />
          </div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800 }}>
            Biblioteca
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {isRegistering
              ? 'Create a student account to get started'
              : 'Library Operations & Reservation Portal'}
          </p>
        </div>

        {/* Auth Role Selector Tabs (Only shown when signing in) */}
        {!isRegistering && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: 'var(--bg-input)',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '20px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('STUDENT');
                setRole('STUDENT');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                color: activeTab === 'STUDENT' ? '#FFFFFF' : 'var(--text-muted)',
                background: activeTab === 'STUDENT' ? 'var(--gradient-primary)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <GraduationCap size={16} />
              User / Student
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ADMIN');
                setRole('ADMIN');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                color: activeTab === 'ADMIN' ? '#FFFFFF' : 'var(--text-muted)',
                background: activeTab === 'ADMIN' ? 'var(--gradient-primary)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <ShieldCheck size={16} />
              Staff / Admin
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Sign Up Mode Fields */}
          {isRegistering ? (
            <>
              {/* Full Name */}
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Roll Number */}
              <div className="input-group">
                <label className="input-label">Roll Number / Student ID</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. 21CS001"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  required
                />
              </div>

              {/* Email Address */}
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  className="input-control"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Branch & Year Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Branch</label>
                  <select
                    className="input-control"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  >
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Academic Year</label>
                  <select
                    className="input-control"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="input-group">
                <label className="input-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-control"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Sign In Mode Fields */
            <>
              {/* Sub-Role Selector for Staff */}
              {activeTab === 'ADMIN' && (
                <div className="input-group">
                  <label className="input-label">Select Staff Role</label>
                  <select
                    className="input-control"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="ADMIN">Library Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              )}

              {/* Email Input */}
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  className="input-control"
                  placeholder={
                    activeTab === 'STUDENT' ? 'student@university.edu' : 'admin@biblioteca.com'
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Input */}
              <div className="input-group">
                <label className="input-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-control"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{
              width: '100%',
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              'Processing...'
            ) : isRegistering ? (
              <>
                <UserPlus size={18} /> Register & Sign In
              </>
            ) : (
              <>
                <LogIn size={18} /> Login as {activeTab === 'STUDENT' ? 'User / Student' : role}
              </>
            )}
          </button>
        </form>

        {/* Sign In / Sign Up Mode Switcher */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem' }}>
          {isRegistering ? (
            <p style={{ color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#F57025',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Sign In
              </button>
            </p>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>
              New user?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setActiveTab('STUDENT');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#F57025',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Create an account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;