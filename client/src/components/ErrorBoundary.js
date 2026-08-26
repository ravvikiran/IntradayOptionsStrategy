import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary, #0a0e17)',
          color: 'var(--text-primary, #f1f5f9)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
          <h2 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', marginBottom: '1.5rem', maxWidth: '400px' }}>
            {this.state.error?.message || 'An unexpected error occurred. Please try reloading the page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.7rem 1.4rem',
              background: 'var(--color-accent, #3b82f6)',
              border: 'none',
              color: 'white',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
