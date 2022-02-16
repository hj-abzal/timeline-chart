import {DPI_WIDTH, WIDTH} from './constants';
import {computeBoundaries, css, line, toCoords} from './utils';

const HEIGHT = 40;
const DPI_HEIGHT = HEIGHT * 2;
const MIN_WIDTH = WIDTH * 0.05;


export const sliderChart = (root: any, data: any) => {
  const canvas = root.querySelector('canvas');
  const $left = root.querySelector('[data-el="left"]');
  const $window = root.querySelector('[data-el="window"]');
  const $right = root.querySelector('[data-el="right"]');
  const defaultWidth = WIDTH * 0.3;

  const mousedown = (event: any) => {

  };
  root.addEventListener('mousedown', mousedown);


  const setPosition = (left: number, right: number) => {
    const w = WIDTH - right - left;

    if (w < MIN_WIDTH) {
      css($window, {width: MIN_WIDTH + 'px'});
      css($left, {width: '0px'});
      return;
    }

    if (right < 0) {
      css($window, {right: '0px'});
      css($right, {width: '0px'});
      return;
    }
    if (left < 0) {
      css($window, {left: '0px'});
      css($left, {width: '0px'});
      return;
    }


    css($window, {
      width: w + 'px',
      left: left + 'px',
      right: right + 'px'
    });

    css($right, {width: right + 'px'});
    css($left, {width: left + 'px'});

    console.log(defaultWidth);

  };


  setPosition(0, WIDTH - defaultWidth);

  const ctx = canvas.getContext('2d');
  canvas.width = DPI_WIDTH;
  canvas.height = DPI_HEIGHT;

  canvas.style.width = WIDTH + 'px';
  canvas.style.height = HEIGHT + 'px';

  const [yMin, yMax] = computeBoundaries(data);
  const yRatio = DPI_HEIGHT / (yMax - yMin);
  const xRatio = DPI_WIDTH / (data.columns[0].length - 2);
  const yData = data.columns.filter((col: any) => data.types[col[0]] === 'line');


  yData.map(toCoords(xRatio, yRatio, DPI_HEIGHT, -5)).forEach((coords: any, index: number) => {
    const color = data.colors[yData[index][0]];
    line(ctx, coords, color);
  });
};
