const express = require('express');
const store = require('../services/store');

const router = express.Router();
const COLLECTION = 'hotwords';

router.get('/', (_req, res) => {
  res.json(store.readAll(COLLECTION));
});

router.post('/', (req, res, next) => {
  try {
    const { term, aliases = [] } = req.body || {};
    if (!term || typeof term !== 'string') {
      return res.status(400).json({ error: 'term is required' });
    }
    const safeAliases = Array.isArray(aliases) ? aliases.filter((a) => typeof a === 'string') : [];
    const created = store.add(COLLECTION, { term, aliases: safeAliases });
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
