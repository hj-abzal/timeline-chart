import {DPI_WIDTH} from './constants';

export const isOver = (mouse: any, x: number, length: number) => {
  const width = DPI_WIDTH / length;
  return Math.abs(x - mouse.x) < width / 2;
};

export const toDate = (timestamp: Date) => {
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const date = new Date(timestamp);
  return `${shortMonths[date.getMonth()]} ${date.getDate()}`;
};


export const computeBoundaries = (data: any) => {
  let min = 0;
  let max = 0;
  data.columns.forEach((col: any) => {
    if (data.types[col[0]] !== 'line') {
      return;
    }
    if (typeof min !== 'number') min = col[1];
    if (typeof max !== 'number') max = col[1];

    if (min > col[1]) min = col[1];
    if (max < col[1]) max = col[1];

    for (let i = 2; i < col.length; i++) {
      if (min > col[i]) min = col[i];
      if (max < col[i]) max = col[i];
    }
  });

  return [min, max];
};


export const toCoords = (xRatio: number, yRatio: number, DPI_HEIGHT: number, PADDING: number) => {
  return (col: any) =>
    col
      .map((y: any, i: number) => [Math.floor((i - 1) * xRatio), Math.floor(DPI_HEIGHT - PADDING - y * yRatio)])
      .filter((_: any, i: number) => i !== 0);
};

export const css = (el: any, styles = {}) => {
  return Object.assign(el.style, styles);
};

export const line = (ctx: any, coords: any, color: string) => {
  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  for (const [x, y] of coords) {
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.closePath();
};
