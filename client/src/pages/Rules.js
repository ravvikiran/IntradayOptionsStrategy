import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Rules() {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/learning/rules')
      .then(res => {
        setRules(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="loading-spinner"></div></div>;
  if (!rules) return <div className="error-msg">Rules not found</div>;

  return (
    <div className="rules-page">
      <h1>📜 Trading Rules & Checklist</h1>
      <p>These rules are enforced by the signal engine. Follow them strictly.</p>

      {rules.content?.sections?.map((section, idx) => (
        <div className="content-section" key={idx}>
          <h2>{section.title}</h2>
          <div className="body" style={{whiteSpace: 'pre-wrap', lineHeight: 1.8}}>
            {section.body}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Rules;
