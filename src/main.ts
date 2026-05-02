class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  paddle = { x: 190, y: 290, w: 100, h: 10, speed: 5 };
  keys: { [key: string]: boolean } = {
    ArrowLeft: false,
    ArrowRight: false,
  };

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

  update() {
    const { canvas, keys, paddle } = this;

    if (keys['ArrowLeft']) paddle.x -= paddle.speed;
    if (keys['ArrowRight']) paddle.x += paddle.speed;

    // Clamp to canvas edges
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));
  }

  draw() {
    const { canvas, paddle } = this;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.fillStyle = '#0095DD';
    this.ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

const game = new Game();
game.loop(); // kick things off
