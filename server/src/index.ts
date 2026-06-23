import express, { type Express, type Request, type Response } from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import scoresRouter from './scores.ts';

const PORT = 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(express.json());
app.use('/api/scores', scoresRouter);
app.use(express.static(path.join(__dirname, '../../client/dist')));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
