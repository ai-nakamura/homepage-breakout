import { Router, type Request, type Response } from 'express';
import db from './db.ts';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const { name, score } = req.body;

  console.log(name, score);

  // check name is clean for posting to db
  if (typeof name !== 'string') {
    clientError(res, 'name must be a string');
    return;
  }
  if (name !== name.trim()) {
    clientError(res, 'name must not begin or end with whitespace');
    return;
  }
  if (name.length < 1 || name.length > 20) {
    clientError(res, 'name must be 1–20 characters');
    return;
  }

  // check score is clean for posting to db
  if (typeof score !== 'number') {
    clientError(res, 'score must be a number');
    return;
  }
  if (!Number.isInteger(score)) {
    clientError(res, 'score must be an integer');
    return;
  }
  if (score < 0) {
    clientError(res, 'score must be a non-negative integer');
    return;
  }

  db.prepare('INSERT INTO scores (name, score) VALUES (?, ?)').run(name, score);
  res.status(201).json({ ok: true });
});

router.get('/top', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT name, score FROM scores ORDER BY score DESC LIMIT 10').all();
  res.json(rows);
});

// ── helpers ────────────────────────────────────────────
function clientError(res: Response, err: string) {
  res.status(400).json({ error: err });
}

export default router;
