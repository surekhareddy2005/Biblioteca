import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { BookOpen, LogOut, User, Sun, Moon } from 'lucide-react';
import Badge from './Badge';

const Navbar = () => {
  const { user, logout, role } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        height: '70px',
        background: 'var(--bg-navbar)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 900,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #F57025 0%, #125B9F 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(245, 112, 37, 0.4)',
          }}
        >
          <BookOpen color="#FFFFFF" size={22} />
        </div>
        <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Biblioteca
        </span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={17} color="#F57025" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon size={17} color="#125B9F" />
              <span>Dark</span>
            </>
          )}
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(18, 91, 159, 0.12)', padding: '6px 14px', borderRadius: '30px', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F57025', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="#FFFFFF" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>{user.name || user.email}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{role}</span>
            </div>
            <Badge type={role} label={role} />
          </div>
        )}

        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Logout"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
