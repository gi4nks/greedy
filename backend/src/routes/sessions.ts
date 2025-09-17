import express, { Request, Response } from 'express';
import { db } from '../../db';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const adventure = req.query.adventure || null;
  let rows;
  if (adventure) {
    rows = db.prepare('SELECT * FROM sessions WHERE adventure_id = ? ORDER BY date').all(adventure as any);
  } else {
    rows = db.prepare('SELECT * FROM sessions ORDER BY date').all();
  }
  res.json(rows);
});

router.post('/', (req: Request, res: Response) => {
  const { adventure_id, title, date, text } = req.body;
  const info = db.prepare('INSERT INTO sessions (adventure_id, title, date, text) VALUES (?, ?, ?, ?)').run(adventure_id || null, title, date, text);
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(info.lastInsertRowid);
  res.json(row);
});

router.put('/:id', (req: Request, res: Response) => {
  const { title, date, text, adventure_id } = req.body;
  db.prepare('UPDATE sessions SET title = ?, date = ?, text = ?, adventure_id = ? WHERE id = ?').run(title, date, text, adventure_id || null, req.params.id as any);
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id as any);
  res.json(row);
});

router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id as any);
  res.json({ message: 'Session deleted' });
});

export default router;
