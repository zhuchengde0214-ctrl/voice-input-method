const express = require('express');
const { parse } = require('../services/commandParser');

const router = express.Router();

router.post('/', (req, res) => {
  const { text } = req.body || {};
  const result = parse(text);
  res.json({ command: result });
});

module.exports = router;
