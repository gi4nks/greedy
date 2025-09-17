const express = require('express');
const router = express.Router();
const { db } = require('../../db');

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM adventures ORDER BY title').all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM adventures WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { slug, title, description } = req.body;
  const info = db.prepare('INSERT INTO adventures (slug, title, description) VALUES (?, ?, ?)').run(slug, title, description);
  const row = db.prepare('SELECT * FROM adventures WHERE id = ?').get(info.lastInsertRowid);
  res.json(row);
});

module.exports = router;
