class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  keys: { [key: string]: boolean } = {
    ArrowLeft: false,
    ArrowRight: false,
  };

  ball = { x: 240, y: 160, r: 8, dx: 3, dy: -3 };
  paddle = { x: 190, y: 290, w: 100, h: 10, speed: 5 };

  constructor() {
    const canvas = document.getElementById('game') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No Canvas ctx');
    }
    this.canvas = canvas;
    this.ctx = ctx;

    document.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
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
    const { canvas, ctx, ball, paddle } = this;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0095DD';
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

const game = new Game();
game.loop(); // kick things off
