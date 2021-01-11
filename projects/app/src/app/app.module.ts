import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';
// @ts-ignore
import { WireflowModule } from 'wireflow';
import { AppService } from './app.service';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import {RouterModule} from '@angular/router';
import { WireflowMainComponent } from './wireflow-main/wireflow-main.component';
import { GeneralItemsMapComponent } from './general-items-map/general-items-map.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
    WireflowMainComponent,
    GeneralItemsMapComponent,
  ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        WireflowModule.forRoot({
            gMapKey: environment.gMapKey,
        }),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        }),
        RouterModule.forRoot([
          {
            path: '',
            component: WireflowMainComponent,
          },
          {
            path: 'map',
            component: GeneralItemsMapComponent,
          },
        ]),
    ],
  providers: [AppService],
  bootstrap: [AppComponent]
})
export class AppModule { }
