import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import {
  DPI_HEIGHT,
  DPI_WIDTH,
  HEIGHT,
  PADDING,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WIDTH,
  MIN_WIDTH,
  defaultWidth
} from './constants';
import { computeBoundaries, css, line, toCoords, toDate } from './utils';



function noop() { }
@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit {
  @Input() data: any;
  @Output() timestamp = new EventEmitter<any>();

  ngOnInit() {
    const root = document.getElementById('chart');
    if (root) {
      const sliderChart = this.chart(root, this.data);
      sliderChart.init();
    }
  }
  onChage(res: any) {
    this.timestamp.emit(res);
  }

  chart(root: any, data: any) {
    const canvas = root.querySelector('[data-el="main"]');
    const $left = root.querySelector('[data-el="left"]');
    const $window = root.querySelector('[data-el="window"]');
    const $right = root.querySelector('[data-el="right"]');
    const ctx = canvas.getContext('2d');
    canvas.width = DPI_WIDTH;
    canvas.height = DPI_HEIGHT;
    canvas.style.width = WIDTH + 'px';
    canvas.style.height = HEIGHT + 'px';
    let raf = 0;
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

          next();
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


    const clear = () => {
      ctx.clearRect(0, 0, DPI_WIDTH, DPI_HEIGHT);
    };

    const paint = () => {
      clear();
      const [yMin, yMax] = computeBoundaries(data);
      const yRatio = VIEW_HEIGHT / (yMax - yMin);
      const xRatio = VIEW_WIDTH / (data.columns[0].length - 2);
      const yData = data.columns.filter((col: any) => data.types[col[0]] === 'line');
      const xData = data.columns.filter((col: any) => data.types[col[0]] === 'x')[0];

      this.xAxis(ctx, xData, xRatio);
      this.yAxis(ctx)
      yData.map(toCoords(xRatio, yRatio, DPI_HEIGHT, PADDING)).forEach((coords: any, index: number) => {
        const color = data.colors[yData[index][0]];
        line(ctx, coords, color);
      });
    };


    const getPosition = () => {
      const left = parseInt($left.style.width);
      const right = WIDTH - parseInt($right.style.width);
      const length = this.data.columns[0].length;
      const leftIndex = Math.round((length * (left * 100 / WIDTH)) / 100) + 1
      const rightIndex = Math.round((length * (right * 100 / WIDTH)) / 100) - 1
      const res: any = []
      this.data.columns[0].forEach((col: any, index: number) => {

        if (index === leftIndex || index === rightIndex) {
          res.push(toDate(col))
        }
      });
      this.onChage(res)
    }


    return {
      init() {
        paint();
      },
      onDestroy() {
        cancelAnimationFrame(raf);
        root.removeEventListener('mousedown', mousedown);
        root.removeEventListener('mouseup', mouseup);

      },
    };
  }


  yAxis(ctx: any) {
    ctx.beginPath();
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#96a2aa';

    ctx.moveTo(0, DPI_HEIGHT - PADDING);
    ctx.lineTo(DPI_WIDTH, DPI_HEIGHT - PADDING);

    ctx.stroke();
    ctx.closePath();
  }

  xAxis(ctx: any, xData: any, xRatio: number) {
    const colsCount = 6;
    const step = Math.round(xData.length / colsCount);
    ctx.beginPath();
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1;
    ctx.font = 'normal 20px Helvetica, sans-serif ';
    ctx.fillStyle = '#96a2aa';
    for (let i = 1; i < xData.length; i++) {
      const text = toDate(xData[i]);
      const x = i * xRatio;
      ctx.fillText(text.toString(), x, DPI_WIDTH - 10);
    }
    for (let i = 1; i < xData.length; i++) {
      const x = i * xRatio;
      if ((i - 1) % step === 0) {
        const text = toDate(xData[i]);
        ctx.fillText(text.toString(), x, DPI_HEIGHT - 10);
      }
      ctx.stroke();

    }

    ctx.stroke();
    ctx.closePath();
  }





}
