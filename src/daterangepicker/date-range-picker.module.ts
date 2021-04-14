import { CommonModule } from '@angular/common';
import {  ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';

import { DateRangePickerComponent } from './date-range-picker.component';
import { DateRangePickerDirective } from './date-range-picker.directive';
import { LocaleConfig, LOCALE_CONFIG } from './date-range-picker.config';
import { LocaleService } from './locale.service';

@NgModule({
  declarations: [
    DateRangePickerComponent,
    DateRangePickerDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  exports: [
    DateRangePickerComponent,
    DateRangePickerDirective
  ],
  entryComponents: [
    DateRangePickerComponent
  ]
})
export class NgxDateRangePickerMd {
  constructor() {
  }
  static forRoot(config: LocaleConfig = {}): ModuleWithProviders<NgxDateRangePickerMd> {
    return {
      ngModule: NgxDateRangePickerMd,
      providers: [
        { provide: LOCALE_CONFIG, useValue: config},
        { provide: LocaleService, useClass: LocaleService, deps: [LOCALE_CONFIG]}
      ]
    };
  }
}
