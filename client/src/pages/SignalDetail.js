import React from 'react';
import { Link } from 'react-router-dom';

function SignalDetail() {
  return (
    <div>
      <Link to="/" className="back-link">← Back to Dashboard</Link>
      <p>Signal details are shown directly on the dashboard for each symbol.</p>
    </div>
  );
}

export default SignalDetail;
