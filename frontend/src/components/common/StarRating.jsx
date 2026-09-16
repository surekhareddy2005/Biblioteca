import React, { useState } from 'react';
import { Star } from 'lucide-react';

// Reusable star rating.
// - Read-only display when `onChange` is not provided.
// - Interactive picker (hover + click) when `onChange` is provided.
const StarRating = ({ value = 0, onChange = null, size = 18 }) => {
  const [hovered, setHovered] = useState(0);
  const interactive = typeof onChange === 'function';
  const displayValue = interactive && hovered > 0 ? hovered : value;

  return (
    <div style={{ display: 'inline-flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          onClick={interactive ? () => onChange(star) : undefined}
          onMouseEnter={interactive ? () => setHovered(star) : undefined}
          onMouseLeave={interactive ? () => setHovered(0) : undefined}
          style={{
            cursor: interactive ? 'pointer' : 'default',
            transition: 'transform 0.15s ease',
          }}
          color={star <= displayValue ? '#f59e0b' : 'var(--text-dim)'}
          fill={star <= displayValue ? '#f59e0b' : 'none'}
        />
      ))}
    </div>
  );
};

export default StarRating;