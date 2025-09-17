const express = require('express');
const router = express.Router();
const { db } = require('../../db');
const { parseTags, stringifyTags } = require('../utils');

router.get('/', (req, res) => {
  const adventure = req.query.adventure || null;
  let rows;
  if (adventure) rows = db.prepare('SELECT * FROM locations WHERE adventure_id = ?').all(adventure);
  else rows = db.prepare('SELECT * FROM locations').all();
  rows.forEach(r => r.tags = parseTags(r.tags));
  res.json(rows);
});

router.post('/', (req, res) => {
  const { adventure_id, name, description, notes, tags } = req.body;
  const info = db.prepare('INSERT INTO locations (adventure_id, name, description, notes, tags) VALUES (?, ?, ?, ?, ?)').run(adventure_id || null, name, description, notes, stringifyTags(tags));
  const row = db.prepare('SELECT * FROM locations WHERE id = ?').get(info.lastInsertRowid);
  row.tags = parseTags(row.tags);
  res.json(row);
});

router.put('/:id', (req, res) => {
  const { name, description, notes, tags, adventure_id } = req.body;
  db.prepare('UPDATE locations SET name = ?, description = ?, notes = ?, tags = ?, adventure_id = ? WHERE id = ?').run(name, description, notes, stringifyTags(tags), adventure_id || null, req.params.id);
  const row = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id);
  row.tags = parseTags(row.tags);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM locations WHERE id = ?').run(req.params.id);
  res.json({ message: 'Location deleted' });
});

module.exports = router;
