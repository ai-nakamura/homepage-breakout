# Breakout

A browser-based Breakout game with a persistent leaderboard. Live at [breakout.mynameis.ai](https://breakout.mynameis.ai).

## Stack

| Layer | Technology |
|---|---|
| Client | Vanilla TypeScript, Vite |
| Server | Node.js, Express 5 |
| Database | SQLite via better-sqlite3 |
| Hosting | Linode VPS (Debian), nginx, systemd |
| TLS | Let's Encrypt via certbot |

## Project structure

```
Breakout/
├── client/          # Browser game (Vite + TypeScript)
│   ├── src/
│   │   ├── main.ts  # Game logic and rendering
│   │   ├── api.ts   # Leaderboard API calls
│   │   └── style.css
│   └── dist/        # Built output (git-ignored)
├── server/          # Express API server
│   └── src/
│       ├── index.ts # Server entry point, static file serving
│       ├── scores.ts # /api/scores router
│       └── db.ts    # SQLite connection and schema
├── deploy/
│   ├── nginx-breakout.conf  # nginx server block for breakout.mynameis.ai
│   └── breakout.service     # systemd unit file
└── scores.db        # SQLite database (git-ignored, lives one level above server/)
```

## Local development

### Prerequisites

- Node.js 22+

### Setup

Install dependencies for both client and server:

```bash
cd client && npm install
cd ../server && npm install
```

Start the server:

```bash
cd server && npm run dev
```

Start the client dev server (in a separate terminal):

```bash
cd client && npm run dev
```

The game runs at `http://localhost:5173`. The Vite dev server proxies `/api` requests to the Express server on port `3001`, so both need to be running for the leaderboard to work.

## How it works

### Game

The game is rendered on an HTML `<canvas>` element using the Canvas 2D API. The game loop runs via `requestAnimationFrame`. When a round ends (win or game over), the player enters their name and their score is submitted to the API. The top 10 scores are then fetched and displayed on the end screen, with the player's own entry highlighted.

### API

The Express server exposes two endpoints:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/scores` | Submit a name and score |
| `GET` | `/api/scores/top` | Fetch the top 10 scores |

The server also serves the built client files as static assets, so a single process handles everything in production.

### Database

Scores are stored in a SQLite database (`scores.db`) one level above the server directory. The schema is created automatically on first run if it doesn't exist:

```sql
CREATE TABLE IF NOT EXISTS scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  score      INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

> **Note:** Score submission trusts the client — the score value is whatever the browser sends. There is no server-side verification that the score is legitimate.

## Deployment

The app is deployed on a Linode VPS running as a user under systemd, with nginx as a reverse proxy.

### Server layout

```
/home/ai/apps/breakout/
├── client/
│   └── dist/       # Built client files served as static assets
└── server/         # Express server source and dependencies
```

### Build and upload

Build the client locally:

```bash
cd client && npm run build
```

Upload to the server (excludes `node_modules`):

```bash
scp -r client/dist root@mynameis.ai:/home/ai/apps/breakout/client/
scp -r server/src server/package.json server/package-lock.json server/tsconfig.json root@mynameis.ai:/home/ai/apps/breakout/server/
```

Install dependencies on the server:

```bash
ssh root@mynameis.ai
cd /home/ai/apps/breakout/server && npm install
```

### nginx

The config at `deploy/nginx-breakout.conf` is symlinked into `/etc/nginx/sites-enabled/`. It proxies all traffic for `breakout.mynameis.ai` to Express on port `3001`. After any changes:

```bash
/usr/sbin/nginx -t && systemctl reload nginx
```

### systemd

The service file at `deploy/breakout.service` lives at `/etc/systemd/system/breakout.service`. Useful commands:

```bash
systemctl status breakout    # check if running
systemctl restart breakout   # restart after a deploy
systemctl stop breakout      # stop the server
journalctl -u breakout -f    # stream logs
```

### TLS

HTTPS is provided by Let's Encrypt. The certificate was obtained with:

```bash
certbot --nginx -d breakout.mynameis.ai
```

Certbot automatically renews the certificate before it expires.
