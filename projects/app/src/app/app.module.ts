import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// @ts-ignore
import { WireflowModule } from 'wireflow';

import { AppService } from './app.service';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    WireflowModule,
  ],
  providers: [AppService],
  bootstrap: [AppComponent]
})
export class AppModule { }
