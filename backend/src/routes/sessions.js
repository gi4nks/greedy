const express = require('express');
const router = express.Router();
const { db } = require('../../db');

router.get('/', (req, res) => {
  const adventure = req.query.adventure || null;
  let rows;
  if (adventure) {
    rows = db.prepare('SELECT * FROM sessions WHERE adventure_id = ? ORDER BY date').all(adventure);
  } else {
    rows = db.prepare('SELECT * FROM sessions ORDER BY date').all();
  }
  res.json(rows);
});

router.post('/', (req, res) => {
  const { adventure_id, title, date, text } = req.body;
  const info = db.prepare('INSERT INTO sessions (adventure_id, title, date, text) VALUES (?, ?, ?, ?)').run(adventure_id || null, title, date, text);
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(info.lastInsertRowid);
  res.json(row);
});

router.put('/:id', (req, res) => {
  const { title, date, text, adventure_id } = req.body;
  db.prepare('UPDATE sessions SET title = ?, date = ?, text = ?, adventure_id = ? WHERE id = ?').run(title, date, text, adventure_id || null, req.params.id);
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
  res.json({ message: 'Session deleted' });
});

module.exports = router;
