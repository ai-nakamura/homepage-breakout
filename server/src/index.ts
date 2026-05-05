import express, { type Express, type Request, type Response } from 'express';
import scoresRouter from './scores.ts';

const PORT = 3001;

const app: Express = express();

app.use(express.json());
app.use('/scores', scoresRouter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
