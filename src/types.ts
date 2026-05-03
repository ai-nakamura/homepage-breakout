type Entity = {
  x: number;
  y: number;
};

export type Ball = Entity & {
  r: number;
  dx: number;
  dy: number;
  speed: number;
};
export type Paddle = Entity & {
  w: number;
  h: number;
  speed: number;
};
export type Brick = Entity & {
  active: boolean;
};
