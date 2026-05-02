import * as type from './types.ts';

const COLS = 7;
const ROWS = 4;
const BRICK_W = 60;
const BRICK_H = 16;
const PADDING = 8;
const OFFSET_TOP = 40;
const OFFSET_LEFT = 20;

class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  keys: { [key: string]: boolean } = {
    ArrowLeft: false,
    ArrowRight: false,
  };

  ball: type.Ball = { x: 240, y: 160, r: 8, dx: 3, dy: -3 };
  paddle: type.Paddle = { x: 190, y: 290, w: 100, h: 10, speed: 5 };
  bricks: type.Brick[][] = [];
  score: number = 0;

  constructor() {
    const { keys, bricks } = this;

    const canvas = document.getElementById('game') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No Canvas ctx');
    }
    this.canvas = canvas;
    this.ctx = ctx;

    document.addEventListener('keydown', (e) => {
      keys[e.key] = true;
    });
    document.addEventListener('keyup', (e) => {
      keys[e.key] = false;
    });

    // Build the brick grid
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
  }

  checkPaddleCollision() {
    const { ball, paddle } = this;

    const hitsPaddleTop = ball.y + ball.r >= paddle.y;
    const withinPaddleX = ball.x >= paddle.x && ball.x <= paddle.x + paddle.w;

    if (hitsPaddleTop && withinPaddleX) {
      ball.dy = -Math.abs(ball.dy); // always bounce upward

      // Optional: vary angle based on hit position
      const hitPos = (ball.x - paddle.x) / paddle.w; // 0 (left) to 1 (right)
      ball.dx = (hitPos - 0.5) * 6; // skew direction
    }
  }

  checkBrickCollisions() {
    const { ball, bricks } = this;
    let { score } = this;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const b = bricks[r][c];
        if (!b.active) continue;

        const hitX = ball.x + ball.r >= b.x && ball.x - ball.r <= b.x + BRICK_W;
        const hitY = ball.y + ball.r >= b.y && ball.y - ball.r <= b.y + BRICK_H;

        if (hitX && hitY) {
          ball.dy = -ball.dy;
          b.active = false;
          score++;

          if (bricks.flat().every((bk) => !bk.active)) {
            alert('You win!');
            document.location.reload();
          }
        }
      }
    }
  }

  update() {
    const { canvas, keys, ball, paddle } = this;

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Left / right walls
    if (ball.x - ball.r < 0 || ball.x + ball.r > canvas.width) {
      ball.dx = -ball.dx;
    }

    // Top wall
    if (ball.y - ball.r < 0) {
      ball.dy = -ball.dy;
    }

    this.checkPaddleCollision();
    this.checkBrickCollisions();

    // Bottom — game over
    if (ball.y + ball.r > canvas.height) {
      alert('Game over!');
      document.location.reload();
    }

    if (keys['ArrowLeft']) paddle.x -= paddle.speed;
    if (keys['ArrowRight']) paddle.x += paddle.speed;

    // Clamp to canvas edges
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));
  }

  draw() {
    const { canvas, ctx, ball, paddle, bricks } = this;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0095DD';
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();

    // Draw bricks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (bricks[r][c].active) {
          ctx.fillStyle = '#E94560';
          ctx.fillRect(bricks[r][c].x, bricks[r][c].y, BRICK_W, BRICK_H);
        }
      }
    }
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

const game = new Game();
game.loop(); // kick things off
