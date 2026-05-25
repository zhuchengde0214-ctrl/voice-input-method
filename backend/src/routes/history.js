const express = require('express');
const store = require('../services/store');

const router = express.Router();
const COLLECTION = 'history';
const MAX_ITEMS = 200;

router.get('/', (_req, res) => {
  res.json(store.readAll(COLLECTION).slice(0, MAX_ITEMS));
});

router.post('/', (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }
    const created = store.add(COLLECTION, { text });
    // Trim to keep file size bounded.
    const all = store.readAll(COLLECTION);
    if (all.length > MAX_ITEMS) store.writeAll(COLLECTION, all.slice(0, MAX_ITEMS));
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res) => {
  const ok = store.remove(COLLECTION, req.params.id);
  if (!ok) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

router.delete('/', (_req, res) => {
  store.clear(COLLECTION);
  res.status(204).end();
});

module.exports = router;
