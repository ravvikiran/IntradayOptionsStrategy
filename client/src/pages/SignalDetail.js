import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// This page is kept for route compatibility but redirects to Dashboard
function SignalDetail() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📊</div>
      <h3>Signal Details</h3>
      <p>Use the Dashboard to generate and view live signals with full analysis.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Go to Dashboard
      </Link>
    </div>
  );
}

export default SignalDetail;
