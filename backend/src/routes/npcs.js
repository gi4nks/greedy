const express = require('express');
const router = express.Router();
const { db } = require('../../db');
const { parseTags, stringifyTags } = require('../utils');

router.get('/', (req, res) => {
  const adventure = req.query.adventure || null;
  let rows;
  if (adventure) rows = db.prepare('SELECT * FROM npcs WHERE adventure_id = ?').all(adventure);
  else rows = db.prepare('SELECT * FROM npcs').all();
  rows.forEach(r => r.tags = parseTags(r.tags));
  res.json(rows);
});

router.post('/', (req, res) => {
  const { adventure_id, name, role, description, tags } = req.body;
  const info = db.prepare('INSERT INTO npcs (adventure_id, name, role, description, tags) VALUES (?, ?, ?, ?, ?)').run(adventure_id || null, name, role, description, stringifyTags(tags));
  const row = db.prepare('SELECT * FROM npcs WHERE id = ?').get(info.lastInsertRowid);
  row.tags = parseTags(row.tags);
  res.json(row);
});

router.put('/:id', (req, res) => {
  const { name, role, description, tags, adventure_id } = req.body;
  db.prepare('UPDATE npcs SET name = ?, role = ?, description = ?, tags = ?, adventure_id = ? WHERE id = ?').run(name, role, description, stringifyTags(tags), adventure_id || null, req.params.id);
  const row = db.prepare('SELECT * FROM npcs WHERE id = ?').get(req.params.id);
  row.tags = parseTags(row.tags);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM npcs WHERE id = ?').run(req.params.id);
  res.json({ message: 'NPC deleted' });
});

module.exports = router;
