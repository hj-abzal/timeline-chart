import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ChartComponent} from './chart.component';


@NgModule({
  declarations: [ChartComponent],
  imports: [
    BrowserModule
  ],
  providers: [],
  exports: [
    ChartComponent
  ],
  bootstrap: [ChartComponent]
})
export class ChartModule {
}
