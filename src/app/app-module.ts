import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { FormsModule } from '@angular/forms';
import { App } from './app';
import { ImageResizeService } from './services/image-resize';

@NgModule({
  declarations: [App],
  imports: [BrowserModule, FormsModule],
  providers: [provideBrowserGlobalErrorListeners(), ImageResizeService],
  bootstrap: [App],
})
export class AppModule {}
