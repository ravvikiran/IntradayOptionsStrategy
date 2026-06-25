const express = require('express');
const router = express.Router();
const learningContent = require('../data/learningContent');

// Get all learning modules
router.get('/modules', (req, res) => {
  const modules = learningContent.map(m => ({
    id: m.id,
    title: m.title,
    description: m.description,
    difficulty: m.difficulty,
    order: m.order,
  }));
  res.json(modules);
});

// Get specific learning module
router.get('/modules/:id', (req, res) => {
  const module = learningContent.find(m => m.id === req.params.id);
  if (!module) {
    return res.status(404).json({ error: 'Module not found' });
  }
  res.json(module);
});

// Get trading rules/checklist
router.get('/rules', (req, res) => {
  res.json(learningContent.find(m => m.id === 'trading-rules'));
});

module.exports = router;
