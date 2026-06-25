import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function LearningModule() {
  const { id } = useParams();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`/api/learning/modules/${id}`)
      .then(res => {
        setModule(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Module not found');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="loading"><div className="loading-spinner"></div></div>;
  if (error) return <div className="error-msg">{error}</div>;
  if (!module) return null;

  const diffClass = module.difficulty === 'All Levels' ? 'All' : module.difficulty;

  return (
    <div className="learning-content">
      <Link to="/learning" className="back-link">← Back to Modules</Link>
      <h1>{module.title}</h1>
      <span className={`difficulty-tag module-difficulty ${diffClass}`}>{module.difficulty}</span>

      {module.content?.sections?.map((section, idx) => (
        <div className="content-section" key={idx}>
          <h2>{section.title}</h2>
          <div className="body">{section.body}</div>
        </div>
      ))}
    </div>
  );
}

export default LearningModule;
