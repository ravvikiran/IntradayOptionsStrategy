import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-ring"><div className="loader-ring-inner"></div></div>
        <p>Loading module...</p>
      </div>
    );
  }
  if (error) return <div className="error-msg">{error}</div>;
  if (!module) return null;

  const diffClass = module.difficulty === 'All Levels' ? 'All' : module.difficulty;

  return (
    <motion.div
      className="learning-content"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link to="/learning" className="back-link">
        <ArrowLeft size={16} /> Back to Modules
      </Link>
      <h1>{module.title}</h1>
      <span className={`difficulty-tag module-difficulty ${diffClass}`}>{module.difficulty}</span>

      {module.content?.sections?.map((section, idx) => (
        <motion.div
          className="content-section"
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <h2>{section.title}</h2>
          <div className="body">{section.body}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default LearningModule;
