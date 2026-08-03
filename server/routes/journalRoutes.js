const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const JOURNAL_FILE = path.join(__dirname, '../data/journal.json');

// Ensure journal file exists
function getJournal() {
  try {
    if (!fs.existsSync(JOURNAL_FILE)) {
      fs.writeFileSync(JOURNAL_FILE, JSON.stringify([], null, 2));
    }
    return JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

function saveJournal(entries) {
  fs.writeFileSync(JOURNAL_FILE, JSON.stringify(entries, null, 2));
}

// Get all journal entries
router.get('/', (req, res) => {
  const entries = getJournal();
  res.json(entries);
});

// Add new journal entry (when user saves a signal)
router.post('/', (req, res) => {
  const entries = getJournal();
  const entry = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    status: 'OPEN', // OPEN, PROFIT, LOSS, EXITED
  };
  entries.unshift(entry);
  saveJournal(entries);
  res.status(201).json(entry);
});

// Update journal entry (close trade, add exit price, notes)
router.put('/:id', (req, res) => {
  const entries = getJournal();
  const idx = entries.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Entry not found' });

  entries[idx] = { ...entries[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveJournal(entries);
  res.json(entries[idx]);
});

// Delete journal entry
router.delete('/:id', (req, res) => {
  let entries = getJournal();
  entries = entries.filter(e => e.id !== req.params.id);
  saveJournal(entries);
  res.json({ success: true });
});

module.exports = router;
