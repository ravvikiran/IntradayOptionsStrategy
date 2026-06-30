const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nseRoutes = require('./routes/nseRoutes');
const signalRoutes = require('./routes/signalRoutes');
const learningRoutes = require('./routes/learningRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/nse', nseRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/learning', learningRoutes);

// Serve static files from client build (works in both dev and production)
const buildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  // Only serve index.html for non-API routes (SPA fallback)
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}`);
});
