import {Component, OnInit} from '@angular/core';
import {
  CIRCLE_RADIUS,
  DPI_HEIGHT,
  DPI_WIDTH,
  HEIGHT,
  PADDING,
  ROWS_COUNT,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WIDTH
} from './constants';
import {computeBoundaries, css, isOver, line, toCoords, toDate} from './utils';
import {sliderChart} from './sliderChart';


const template = (data: any) => `
  <div class="tooltip-title">${data.title}</div>
  <ul class="tooltip-list">
    ${data.items
  .map((item: any) => {
    return `<li style="display: flex" class="tooltip-list-item">
        <div class="value" style="color: ${item.color}">${item.value}</div>
        <div class="name" style="color: ${item.color}">${item.name}</div>
      </li>`;
  })
  .join('\n')}
  </ul>
`;

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit {

  ngOnInit() {
    const root = document.getElementById('chart');
    if (root) {
      const canvas = root.querySelector('[data-el="main"]');
      const tip = this.tooltip(root.querySelector('[data-el="tooltip"]'));
      const firstChart = this.chart(canvas, this.getChartData(), tip);
      firstChart.init();

      const slider = sliderChart(root.querySelector('[data-el="slider"]'), this.getChartData());
    }
  }


  chart(canvas: any, data: any, tip: any) {
    const ctx = canvas.getContext('2d');
    canvas.width = DPI_WIDTH;
    canvas.height = DPI_HEIGHT;

    canvas.style.width = WIDTH + 'px';
    canvas.style.height = HEIGHT + 'px';


    let raf = 0;

    const proxy = new Proxy({mouse: {}}, {
      set(...args) {
        const res = Reflect.set(...args);
        raf = requestAnimationFrame(paint);
        return res;
      }
    });
    const mousemove = ({clientX, clientY}: MouseEvent) => {

      const {left, top} = canvas.getBoundingClientRect();
      proxy.mouse = {
        x: (clientX - left) * 2,
        tooltip: {
          left: clientX - left,
          top: clientY - top
        }
      };
    };
    const mouseleave = () => {
      proxy.mouse = 0;
      tip.hide();
    };

    canvas.addEventListener('mousemove', mousemove);
    canvas.addEventListener('mouseleave', mouseleave);

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

      this.yAxis(ctx, yMax, yMin);
      this.xAxis(ctx, xData, yData, xRatio, proxy, tip, data);

      yData.map(toCoords(xRatio, yRatio, DPI_HEIGHT, PADDING)).forEach((coords: any, index: number) => {
        const color = data.colors[yData[index][0]];
        line(ctx, coords, color);
        for (const [x, y] of coords) {
          if (isOver(proxy.mouse, x, coords.length)) {
            this.circle(ctx, [x, y], color);
            break;
          }
        }
      });
    };

    return {
      init() {
        paint();
      },
      onDestroy() {
        canvas.removeEventListener('mousemove', mousemove);
        canvas.removeEventListener('mouseleave', mouseleave);
        cancelAnimationFrame(raf);
      }

    };
  }


  yAxis(ctx: any, yMax: number, yMin: number) {
    const step = VIEW_HEIGHT / ROWS_COUNT;
    const textStep = (yMax - yMin) / ROWS_COUNT;

    ctx.beginPath();
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1;
    ctx.font = 'normal 20px Helvetica, sans-serif ';
    ctx.fillStyle = '#96a2aa';
    for (let i = 1; i <= ROWS_COUNT; i++) {
      const y = step * i;
      const text = Math.round(yMax - textStep * i);
      ctx.fillText(text.toString(), 5, y + PADDING - 10);
      ctx.moveTo(0, y + PADDING);
      ctx.lineTo(DPI_WIDTH, y + PADDING);
    }
    ctx.stroke();
    ctx.closePath();
  }

  xAxis(ctx: any, xData: any, yData: any, xRatio: number, {mouse}: any, tip: any, data: any) {
    const colsCount = 6;
    const step = Math.round(xData.length / colsCount);
    ctx.beginPath();
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
      if (isOver(mouse, x, xData.length)) {

        ctx.save();
        ctx.moveTo(x, PADDING / 2);
        ctx.lineTo(x, DPI_HEIGHT - PADDING);
        ctx.restore();

        tip.show(mouse.tooltip, {
          title: toDate(xData[i]),
          items: yData.map((col: any) => ({
            color: data.colors[col[0]],
            name: data.names[col[0]],
            value: col[i + 1]
          }))
        });
      }
    }
    ctx.stroke();
    ctx.closePath();
  }


  circle(ctx: any, [x, y]: [number, number], color: string) {
    ctx.beginPath();
    ctx.arc(x, y, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  }

//----------------------------------------------------------------------

  tooltip(el: any) {

    const clear = () => el.innerHTML = '';
    return {
      show({left, top}: any, data: any) {
        const {height, width} = el.getBoundingClientRect();
        clear();
        css(el, {
          display: 'block',
          top: top - height + 'px',
          left: left + width / 2 + 'px'
        });
        el.insertAdjacentHTML('afterbegin', template(data));
      },
      hide() {
        css(el, {display: 'none'});
      }
    };
  }

  getChartData() {
    return [
      {
        columns: [
          [
            'x',
            1542412800000,
            1542499200000,
            1542585600000,
            1542672000000,
            1542758400000,
            1542844800000,
            1542931200000,
            1543017600000,
            1543104000000,
            1543190400000,
            1543276800000,
            1543363200000,
            1543449600000,
            1543536000000,
            1543622400000,
            1543708800000,
            1543795200000,
            1543881600000,
            1543968000000,
            1544054400000,
            1544140800000,
            1544227200000,
            1544313600000,
            1544400000000,
            1544486400000,
            1544572800000,
            1544659200000,
            1544745600000,
            1544832000000,
            1544918400000,
            1545004800000,
            1545091200000,
            1545177600000,
            1545264000000,
            1545350400000,
            1545436800000,
            1545523200000,
            1545609600000,
            1545696000000,
            1545782400000,
            1545868800000,
            1545955200000,
            1546041600000,
            1546128000000,
            1546214400000,
            1546300800000,
            1546387200000,
            1546473600000,
            1546560000000,
            1546646400000,
            1546732800000,
            1546819200000,
            1546905600000,
            1546992000000,
            1547078400000,
            1547164800000,
            1547251200000,
            1547337600000,
            1547424000000,
            1547510400000,
            1547596800000,
            1547683200000,
            1547769600000,
            1547856000000,
            1547942400000,
            1548028800000,
            1548115200000,
            1548201600000,
            1548288000000,
            1548374400000,
            1548460800000,
            1548547200000,
            1548633600000,
            1548720000000,
            1548806400000,
            1548892800000,
            1548979200000,
            1549065600000,
            1549152000000,
            1549238400000,
            1549324800000,
            1549411200000,
            1549497600000,
            1549584000000,
            1549670400000,
            1549756800000,
            1549843200000,
            1549929600000,
            1550016000000,
            1550102400000,
            1550188800000,
            1550275200000,
            1550361600000,
            1550448000000,
            1550534400000,
            1550620800000,
            1550707200000,
            1550793600000,
            1550880000000,
            1550966400000,
            1551052800000,
            1551139200000,
            1551225600000,
            1551312000000,
            1551398400000,
            1551484800000,
            1551571200000,
            1551657600000,
            1551744000000,
            1551830400000,
            1551916800000,
            1552003200000
          ],
          [
            'y0',
            37,
            20,
            32,
            39,
            32,
            35,
            19,
            65,
            36,
            62,
            113,
            69,
            120,
            60,
            51,
            49,
            71,
            12,
            149,
            69,
            57,
            21,
            33,
            55,
            92,
            62,
            47,
            50,
            56,
            116,
            63,
            60,
            55,
            65,
            76,
            33,
            45,
            64,
            54,
            81,
            180,
            123,
            106,
            37,
            60,
            70,
            46,
            68,
            46,
            51,
            33,
            57,
            75,
            70,
            95,
            70,
            50,
            68,
            63,
            66,
            53,
            38,
            52,
            109,
            121,
            53,
            36,
            71,
            96,
            55,
            58,
            29,
            31,
            55,
            52,
            44,
            126,
            191,
            73,
            87,
            255,
            278,
            219,
            170,
            129,
            125,
            126,
            84,
            65,
            53,
            154,
            57,
            71,
            64,
            75,
            72,
            39,
            47,
            52,
            73,
            89,
            156,
            86,
            105,
            88,
            45,
            33,
            56,
            142,
            124,
            114,
            64
          ]
        ],
        types: {
          y0: 'line',
          x: 'x'
        },
        names: {
          y0: '#0'
        },
        colors: {
          y0: '#3DC23F'
        }
      }
    ][0];
  }
}
