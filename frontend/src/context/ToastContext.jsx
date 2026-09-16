import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: {
    background: 'rgba(16, 185, 129, 0.95)',
    icon: CheckCircle2,
  },
  error: {
    background: 'rgba(244, 63, 94, 0.95)',
    icon: XCircle,
  },
  info: {
    background: 'rgba(59, 130, 246, 0.95)',
    icon: Info,
  },
};

const DEFAULT_DURATION = 3400;

// Small synthesized chime via Web Audio API - no external audio file or
// network request needed. A bright two-note blip for success, a lower
// buzz for error, and a soft single blip for info.
const playToastSound = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const tone = (freq, startTime, duration, gain = 0.08) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, startTime);
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;

    if (type === 'success') {
      tone(740, now, 0.09);
      tone(988, now + 0.09, 0.13);
    } else if (type === 'error') {
      tone(220, now, 0.22, 0.09);
    } else {
      tone(523, now, 0.1, 0.06);
    }

    setTimeout(() => ctx.close(), 500);
  } catch (e) {
    // Audio is a nice-to-have; never let it break the app.
  }
};

/**
 * useToast() returns { success, error, info } - call any of them with a
 * message string to show a floating, auto-dismissing toast that stays
 * visible regardless of scroll position. Replaces inline
 * {message && <div>...</div>} banners across the app.
 *
 *   const toast = useToast();
 *   toast.success('Book reserved successfully!');
 *   toast.error(err.response?.data?.message || 'Something went wrong.');
 */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, text, duration = DEFAULT_DURATION) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, text }]);
      playToastSound(type);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  const api = {
    success: (text, duration) => push('success', text, duration),
    error: (text, duration) => push('error', text, duration),
    info: (text, duration) => push('info', text, duration),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 2100,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: 'min(94vw, 520px)',
        }}
      >
        {toasts.map((t) => {
          const style = TOAST_STYLES[t.type] || TOAST_STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              className="animate-fade-in"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                background: style.background,
                color: '#fff',
                padding: '14px 18px',
                borderRadius: '10px',
                fontSize: '0.92rem',
                fontWeight: 600,
                boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
                width: '100%',
              }}
            >
              <Icon size={19} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ flex: 1, lineHeight: 1.4 }}>{t.text}</span>
              <button
                onClick={() => dismiss(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.85)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  flexShrink: 0,
                }}
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContext;
