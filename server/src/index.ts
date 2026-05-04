import express, { type Express, type Request, type Response } from 'express';

const PORT = 3001;

const app: Express = express();

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
