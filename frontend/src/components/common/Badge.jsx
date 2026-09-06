import React from 'react';

const Badge = ({ type = 'available', label }) => {
  const getBadgeClass = () => {
    switch (type.toLowerCase()) {
      case 'available':
      case 'active':
        return 'badge-available';
      case 'issued':
      case 'pending':
        return 'badge-issued';
      case 'reserved':
        return 'badge-reserved';
      case 'overdue':
      case 'blocked':
      case 'cancelled':
        return 'badge-overdue';
      case 'admin':
      case 'super_admin':
        return 'badge-admin';
      default:
        return 'badge-available';
    }
  };

  return <span className={`badge ${getBadgeClass()}`}>{label || type}</span>;
};

export default Badge;
