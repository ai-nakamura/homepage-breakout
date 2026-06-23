import * as type from './types.ts';
import * as api from './api.ts';

const COLS = 7;
const ROWS = 4;
const BRICK_W = 56;
const BRICK_H = 14;
const PADDING = 8;

const ROW_COLORS = ['#e05', '#e84', '#4a9', '#47c'];

class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  nameInput: HTMLInputElement;
  scoreDisplay: HTMLElement;
  livesDisplay: HTMLElement;
  keys: Record<string, boolean> = {
    ArrowLeft: false,
    ArrowRight: false,
  };

  ball: type.Ball = { x: 240, y: 290, r: 8, dx: 0, dy: 0, speed: 3 };
  paddle: type.Paddle = { x: 190, y: 290, w: 100, h: 10, speed: 5 };
  bricks: type.Brick[][] = [];
  score: number = 0;
  lives: number = 3;
  state: 'start' | 'playing' | 'win' | 'gameover' | 'submitting' = 'start';
  pendingState: 'win' | 'gameover' = 'gameover';

  topScores: { name: string; score: number }[] = [];
  lastSubmittedName: string = '';

  OFFSET_TOP = 40;
  OFFSET_LEFT = 0;

  constructor() {
    const { keys } = this;

    const canvas = document.getElementById('game');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas not supported');
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No Canvas ctx');
    }
    const nameInput = document.getElementById('name-input');
    if (!(nameInput instanceof HTMLInputElement)) {
      throw new Error('No name input');
    }
    const scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) {
      throw new Error('No Score Display');
    }
    const livesDisplay = document.getElementById('lives-display');
    if (!livesDisplay) {
      throw new Error('No lives Display');
    }

    this.canvas = canvas;
    this.ctx = ctx;
    this.nameInput = nameInput;
    this.scoreDisplay = scoreDisplay;
    this.livesDisplay = livesDisplay;

    this.OFFSET_LEFT = (canvas.width - (COLS * (BRICK_W + PADDING) - PADDING)) / 2;

    document.addEventListener('keyup', (e) => {
      keys[e.key] = false;
    });
    document.addEventListener('keydown', (e) => {
      const { state } = this;

      keys[e.key] = true;
      if (e.key === ' ') {
        if (state === 'start' || state === 'gameover' || state === 'win') {
          this.resetGame();
          this.state = 'playing';
          console.log(state);
        }
        e.preventDefault();
      }
    });
    this.nameInput.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter') {
        return;
      }

      const name = this.nameInput.value.trim();
      if (!name) {
        return;
      }

      try {
        await api.submitScore(name, this.score);
        this.lastSubmittedName = name;
        this.topScores = await api.fetchTopScores();
      } catch (err) {
        console.error('Failed to submit score:', err);
      } finally {
        this.nameInput.value = '';
        this.drawNameInput(false);
        this.state = this.pendingState;
      }
    });

    api.fetchTopScores().then((scores) => {
      this.topScores = scores;
    });
    this.resetGame();
  }

  resetGame() {
    const { canvas, bricks, paddle, OFFSET_LEFT, OFFSET_TOP } = this;
    this.score = 0;
    this.lives = 3;
    this.lastSubmittedName = '';

    console.log('resetGame');

    this.resetBall();

    for (let r = 0; r < ROWS; r++) {
      bricks[r] = [];
      for (let c = 0; c < COLS; c++) {
        bricks[r][c] = {
          x: OFFSET_LEFT + c * (BRICK_W + PADDING),
          y: OFFSET_TOP + r * (BRICK_H + PADDING),
          active: true,
        };
      }
    }
    paddle.x = (canvas.width - paddle.w) / 2;

    this.updateHUD();
  }

  resetBall() {
    const { canvas, ball } = this;
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 60;
    ball.dx = ball.speed;
    ball.dy = -ball.speed;
  }

  // ── Collision helpers ────────────────────────────────────────────
  checkPaddleCollision() {
    const { ball, paddle } = this;

    const hitsPaddleTop = ball.y + ball.r >= paddle.y;
    const withinPaddleX = ball.x >= paddle.x && ball.x <= paddle.x + paddle.w;

    if (hitsPaddleTop && withinPaddleX) {
      ball.dy = -Math.abs(ball.dy); // always bounce upward

      const hitPos = (ball.x - paddle.x) / paddle.w; // 0 (left) to 1 (right)
      ball.dx = (hitPos - 0.5) * 6; // skew direction
    }
  }

  checkBrickCollisions() {
    const { ball, bricks } = this;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const b = bricks[r][c];
        if (!b.active) continue;

        const hitX = ball.x + ball.r >= b.x && ball.x - ball.r <= b.x + BRICK_W;
        const hitY = ball.y + ball.r >= b.y && ball.y - ball.r <= b.y + BRICK_H;

        if (hitX && hitY) {
          ball.dy = -ball.dy;
          b.active = false;
          this.score++;

          if (bricks.flat().every((bk) => !bk.active)) {
            this.pendingState = 'win';
            this.state = 'submitting';
            this.drawNameInput(true);
          }
        }
      }
    }
  }

  checkBottomCollision() {
    const { canvas, ball } = this;

    if (ball.y + ball.r > canvas.height) {
      this.lives--;
      if (this.lives > 0) {
        ball.x = canvas.width / 2;
        ball.y = canvas.height - 60;
        ball.dx = ball.speed;
        ball.dy = -ball.speed;
        // paddle.x = (canvas.width - paddle.w) / 2;
      } else {
        this.pendingState = 'gameover';
        this.state = 'submitting';
        this.drawNameInput(true);
      }
    }
  }

  // ── Update ───────────────────────────────────────────────────────
  update() {
    const { canvas, keys, ball, paddle } = this;

    // Paddle movement
    if (keys['ArrowLeft']) paddle.x -= paddle.speed;
    if (keys['ArrowRight']) paddle.x += paddle.speed;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));

    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collisions
    if (ball.x - ball.r < 0 || ball.x + ball.r > canvas.width) ball.dx = -ball.dx;
    if (ball.y - ball.r < 0) ball.dy = -ball.dy;

    // Paddle & brick collisions
    this.checkPaddleCollision();
    this.checkBrickCollisions();
    this.checkBottomCollision();
    this.updateHUD();
  }

  updateHUD() {
    const { livesDisplay, scoreDisplay, lives, score } = this;
    scoreDisplay.textContent = String(score);
    livesDisplay.textContent = String(lives);
  }

  // ── Draw ─────────────────────────────────────────────────────────
  drawBall() {
    const { ctx, ball } = this;

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = '#61b6fb';
    ctx.fill();
    ctx.closePath();
  }

  drawBricks() {
    const { ctx, bricks } = this;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const b = bricks[r][c];
        if (!b.active) continue;
        ctx.fillStyle = ROW_COLORS[r];
        ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H);
      }
    }
  }

  drawPaddle() {
    const { ctx, paddle } = this;

    ctx.fillStyle = '#61b6fb';
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
  }

  drawOverlay(title: string, subtitle: string) {
    const { canvas, ctx } = this;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#fff';
    ctx.font = '500 22px "Share Tech Mono", monospace';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 12);

    ctx.fillStyle = '#666';
    ctx.font = '13px "Share Tech Mono", monospace';
    ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 16);

    // Top scores overlay
    const startY = canvas.height / 2 + 48;

    this.topScores.forEach((entry, i) => {
      const isPlayer = entry.name === this.lastSubmittedName;
      ctx.fillStyle = isPlayer ? '#61b6fb' : '#555';
      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillText(`${i + 1}.  ${entry.name}  ${entry.score}`, canvas.width / 2, startY + i * 10);
    });
  }

  drawNameInput(visible: boolean) {
    this.nameInput.style.display = visible ? 'block' : 'none';
  }

  loop() {
    const { canvas, ctx, score, state } = this;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state === 'playing') {
      this.update();
      this.drawBall();
      this.drawBricks();
      this.drawPaddle();
    } else if (state === 'start') {
      this.drawBall();
      this.drawBricks();
      this.drawPaddle();
      this.drawOverlay('BREAKOUT', 'press space to play');
    } else if (state === 'gameover') {
      this.drawBricks();
      this.drawPaddle();
      this.drawOverlay('GAME OVER', 'press space to try again');
    } else if (state === 'win') {
      this.drawOverlay('YOU WIN', 'score: ' + score + '  —  press space to play again');
    } else if (state === 'submitting') {
      this.drawBall();
      this.drawBricks();
      this.drawPaddle();
      this.drawOverlay(this.pendingState === 'win' ? 'YOU WIN' : 'GAME OVER', 'enter your name below');
    }

    requestAnimationFrame(() => this.loop());
  }
}

const game = new Game();
game.loop(); // kick things off
