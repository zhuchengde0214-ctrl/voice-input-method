const express = require('express');
const cors = require('cors');
const path = require('path');

const enhanceRouter = require('./routes/enhance');
const hotwordsRouter = require('./routes/hotwords');
const historyRouter = require('./routes/history');
const commandRouter = require('./routes/command');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '256kb' }));

app.use('/api/enhance', enhanceRouter);
app.use('/api/hotwords', hotwordsRouter);
app.use('/api/history', historyRouter);
app.use('/api/command', commandRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the frontend from the same origin so the browser only needs one
// reachable port. Keeps deployment dead-simple behind reverse proxies and
// SSH/IDE port-forwarding.
const FRONTEND_DIR = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

app.use((err, _req, res, _next) => {
  // Surface a stable error shape; never leak stack traces to the client.
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[voice-input-method] backend listening on :${PORT}`);
  });
}

module.exports = app;
