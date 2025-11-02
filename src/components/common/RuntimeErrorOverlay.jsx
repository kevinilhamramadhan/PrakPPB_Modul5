import React, { useEffect, useState } from 'react';

export default function RuntimeErrorOverlay() {
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    function handleError(event) {
      const message = event?.message || (event?.reason && event.reason.message) || 'Unknown error';
      const stack = event?.error?.stack || (event?.reason && event.reason.stack) || '';
      setErrorInfo({ message, stack });
      // Also log to console for developer visibility
      console.error('RuntimeErrorOverlay captured error:', event);
    }

    function handleRejection(event) {
      const reason = event?.reason;
      const message = (reason && reason.message) || JSON.stringify(reason) || 'Unhandled rejection';
      const stack = reason?.stack || '';
      setErrorInfo({ message, stack });
      console.error('RuntimeErrorOverlay captured unhandledrejection:', event);
    }

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (!errorInfo) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 800, width: '90%', background: 'rgba(255,255,255,0.98)', border: '1px solid #f5c2c7', borderRadius: 12, padding: 20, boxShadow: '0 6px 30px rgba(0,0,0,0.12)' }}>
        <h3 style={{ margin: 0, marginBottom: 8, color: '#b91c1c' }}>Runtime Error</h3>
        <p style={{ marginTop: 0, marginBottom: 12, color: '#374151' }}>{errorInfo.message}</p>
        {errorInfo.stack && (
          <pre style={{ maxHeight: 240, overflow: 'auto', background: '#f8fafc', padding: 12, borderRadius: 6, color: '#111827' }}>{errorInfo.stack}</pre>
        )}
        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => { setErrorInfo(null); window.location.reload(); }} style={{ padding: '8px 12px', background: '#ef4444', color: 'white', borderRadius: 6, border: 'none' }}>Reload</button>
        </div>
      </div>
    </div>
  );
}
