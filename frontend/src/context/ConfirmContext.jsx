import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

const ConfirmContext = createContext(null);

/**
 * useConfirm() returns an async function:
 *   const confirm = useConfirm();
 *   const ok = await confirm({ title, message, confirmLabel, cancelLabel, danger });
 *   if (ok) { ...proceed... }
 *
 * This replaces window.confirm() with a themed, on-brand dialog that
 * respects light/dark mode and doesn't block the JS thread.
 */
export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return ctx;
};

export const ConfirmProvider = ({ children }) => {
  const [request, setRequest] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setRequest({
        title: options.title || 'Are you sure?',
        message: options.message || '',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        danger: options.danger !== false, // default true: most confirms guard destructive actions
      });
    });
  }, []);

  const handleClose = (result) => {
    setRequest(null);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {request && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => handleClose(false)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '24px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div
                style={{
                  flexShrink: 0,
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: request.danger ? 'rgba(244, 63, 94, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                }}
              >
                {request.danger ? (
                  <AlertTriangle size={20} color="#f87171" />
                ) : (
                  <HelpCircle size={20} color="var(--accent-primary)" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                  {request.title}
                </h3>
                {request.message && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {request.message}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleClose(false)}>
                {request.cancelLabel}
              </button>
              <button
                className={`btn ${request.danger ? 'btn-danger' : 'btn-primary'} btn-sm`}
                onClick={() => handleClose(true)}
                autoFocus
              >
                {request.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export default ConfirmContext;