const API = 'api';

export async function submitScore(name: string, score: number): Promise<void> {
  const res = await fetch(`${API}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error ?? 'Failed to submit score.');
  }
}

export async function fetchTopScores(): Promise<{ name: string; score: number }[]> {
  const res = await fetch(`${API}/scores/top`);
  if (!res.ok) {
    throw new Error('Failed to fetch scores.');
  }
  return res.json();
}
