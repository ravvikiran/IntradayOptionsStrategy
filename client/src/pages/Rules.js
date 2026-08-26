import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-ring"><div className="loader-ring-inner"></div></div>
        <p>Loading rules...</p>
      </div>
    );
  }
  if (!rules) return <div className="error-msg">Rules not found</div>;

  return (
    <div className="rules-page">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Trading Rules & Checklist</h1>
        <p>These rules are enforced by the signal engine. Follow them strictly for consistent results.</p>
      </motion.div>

      {rules.content?.sections?.map((section, idx) => (
        <motion.div
          className="content-section"
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08 }}
        >
          <h2>{section.title}</h2>
          <div className="body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            {section.body}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default Rules;
