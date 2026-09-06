import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  BookOpen,
  ArrowRightLeft,
  Users,
  Clock,
  Calendar,
  BookmarkCheck,
} from 'lucide-react';

const Sidebar = () => {
  const { role } = useAuth();

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/books', label: 'Book Inventory', icon: BookOpen },
    { to: '/admin/issues', label: 'Issue & Returns', icon: ArrowRightLeft },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/reservations', label: 'Reservations Queue', icon: Clock },
    { to: '/admin/holidays', label: 'Holiday Calendar', icon: Calendar },
  ];

  const studentLinks = [
    { to: '/student/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/student/books', label: 'Browse Catalog', icon: BookOpen },
    { to: '/student/reservations', label: 'My Reservations', icon: BookmarkCheck },
  ];

  const links = role === 'STUDENT' ? studentLinks : adminLinks;

  return (
    <aside
      style={{
        width: '240px',
        background: 'var(--bg-sidebar)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 14px',
        gap: '8px',
        minHeight: 'calc(100vh - 70px)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div style={{ padding: '0 12px 12px 12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Navigation
      </div>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 16px',
              borderRadius: '10px',
              color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
              background: isActive
                ? 'linear-gradient(135deg, rgba(245, 112, 37, 0.25) 0%, rgba(18, 91, 159, 0.25) 100%)'
                : 'transparent',
              border: isActive ? '1px solid rgba(245, 112, 37, 0.5)' : '1px solid transparent',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.92rem',
              textDecoration: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            })}
          >
            <Icon size={18} />
            <span>{link.label}</span>
          </NavLink>
        );
      })}
    </aside>
  );
};

export default Sidebar;
