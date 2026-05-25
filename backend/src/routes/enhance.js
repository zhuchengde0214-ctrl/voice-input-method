const express = require('express');
const { enhance } = require('../services/textEnhancer');

const router = express.Router();

router.post('/', (req, res, next) => {
  try {
    const { text, options = {}, hotwords = [] } = req.body || {};
    const result = enhance(text, { ...options, hotwords });
    res.json({ original: text, enhanced: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
