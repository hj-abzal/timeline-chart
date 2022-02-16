import { NgModule } from '@angular/core';
import { DPI_WIDTH, WIDTH } from './constants';
import { computeBoundaries, css, toDate } from './utils';

const HEIGHT = 40;
const DPI_HEIGHT = HEIGHT * 2;
const MIN_WIDTH = WIDTH * 0.05;

function noop() { }

export const sliderChart = (root: any, data: any) => {
  const canvas = root.querySelector('canvas');
  const $left = root.querySelector('[data-el="left"]');
  const $window = root.querySelector('[data-el="window"]');
  const $right = root.querySelector('[data-el="right"]');
  const defaultWidth = WIDTH * 0.3;
  let nextFn = noop;

  const mousedown = (event: any) => {
    const type = event.target.dataset.type;

    const dimentions = {
      left: parseInt($window.style.left),
      right: parseInt($window.style.right),
      width: parseInt($window.style.width)
    }
    if (type === 'window') {
      const startX = event.pageX;
      document.onmousemove = (e: any) => {
        const delta = startX - e.pageX;

        if (delta === 0) {
          return
        }

        let left = dimentions.left - delta;
        let right = WIDTH - left - dimentions.width

        setPosition(left, right)
        next()
      }

    } else if (type === 'left' || type === 'right') {
      const startX = event.pageX;
      document.onmousemove = (e: any) => {
        const delta = startX - e.pageX;

        if (delta === 0) {
          return
        }

        if (type === 'left') {
          const left = WIDTH - (dimentions.width + delta) - dimentions.right;
          const right = WIDTH - (dimentions.width + delta) - left;
          setPosition(left, right)
        } else {
          const right = WIDTH - (dimentions.width - delta) - dimentions.left;
          setPosition(dimentions.left, right)

        }
        next();

      }

    }


  };
  const mouseup = () => {
    document.onmousemove = null;
  }
  root.addEventListener('mousedown', mousedown);
  root.addEventListener('mouseup', mouseup);


  //@ts-ignore
  function next() { nextFn(getPosition()) }
  const setPosition = (left: number, right: number) => {
    const w = WIDTH - right - left;

    if (w < MIN_WIDTH) {
      css($window, { width: MIN_WIDTH + 'px' });
      css($left, { width: '0px' });
      return;
    }

    if (right < 0) {
      css($window, { right: '0px' });
      css($right, { width: '0px' });
      return;
    }
    if (left < 0) {
      css($window, { left: '0px' });
      css($left, { width: '0px' });
      return;
    }


    css($window, {
      width: w + 'px',
      left: left + 'px',
      right: right + 'px'
    });

    css($right, { width: right + 'px' });
    css($left, { width: left + 'px' });
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
  const xData = data.columns.filter((col: any) => data.types[col[0]] === 'x')[0];

  const getPosition = () => {
    const left = parseInt($left.style.width);
    const right = WIDTH - parseInt($right.style.width);

    return [
      left * 100 / WIDTH,
      right * 100 / WIDTH
    ]
  }

  return {
    subscribe(fn: any) {
      nextFn = fn;
      fn(getPosition())
    }
  }
};
