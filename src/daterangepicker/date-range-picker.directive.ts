import {
  ChangeDetectorRef,
  ComponentFactoryResolver, ComponentRef,
  Directive,
  DoCheck,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  HostListener,
  Input,
  KeyValueDiffer,
  KeyValueDiffers,
  OnChanges, OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewContainerRef,
  InjectionToken, Injector
} from '@angular/core';
import { DateRangePickerComponent } from './date-range-picker.component';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import * as _moment from 'moment';
import { LocaleConfig } from './date-range-picker.config';
import { LocaleService } from './locale.service';
import { Overlay, OverlayRef, PositionStrategy, ConnectionPositionPair, OverlayConfig, ComponentType } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { Subject } from 'rxjs';
import { takeUntil, take, tap } from 'rxjs/operators';

const moment = _moment;
export const CONTAINER_DATA = new InjectionToken<{}>('CONTAINER_DATA');

@Directive({
  selector: 'input[ngxDaterangepickerMd]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangePickerDirective), multi: true
    }
  ]
})
export class DateRangePickerDirective implements OnInit, OnDestroy, OnChanges, DoCheck {
  public picker: DateRangePickerComponent;
  private _onChange = Function.prototype;
  private _onTouched = Function.prototype;
  private _validatorChange = Function.prototype;
  private _disabled: boolean;
  private _value: any;
  private localeDiffer: KeyValueDiffer<string, any>;
  notForChangesProperty: Array<string> = [
    'locale',
    'endKey',
    'startKey'
  ];
  @Input()
  private _endKey = 'endDate';
  private _startKey = 'startDate';
  @Input()
  minDate: _moment.Moment;
  @Input()
  maxDate: _moment.Moment;
  @Input()
  autoApply: boolean;
  @Input()
  alwaysShowCalendars: boolean;
  @Input()
  showCustomRangeLabel: boolean;
  @Input()
  linkedCalendars: boolean;
  @Input()
  dateLimit: number = null;
  @Input()
  singleDatePicker: boolean;
  @Input()
  showWeekNumbers: boolean;
  @Input()
  showISOWeekNumbers: boolean;
  @Input()
  showDropdowns: boolean;
  @Input()
  isInvalidDate: Function;
  @Input()
  isCustomDate: Function;
  @Input()
  isTooltipDate: Function;
  @Input()
  showClearButton: boolean;
  @Input()
  customRangeDirection: boolean;
  @Input()
  ranges: any;
  @Input()
  opens: string;
  @Input()
  drops: string;
  firstMonthDayClass: string;
  @Input()
  lastMonthDayClass: string;
  @Input()
  emptyWeekRowClass: string;
  @Input()
  emptyWeekColumnClass: string;
  @Input()
  firstDayOfNextMonthClass: string;
  @Input()
  lastDayOfPreviousMonthClass: string;
  @Input()
  keepCalendarOpeningWithRange: boolean;
  @Input()
  showRangeLabelOnInput: boolean;
  @Input()
  showCancel = false;
  @Input()
  lockStartDate = false;
  // timepicker variables
  @Input()
  timePicker = false;
  @Input()
  timePicker24Hour = false;
  @Input()
  timePickerIncrement = 1;
  @Input()
  timePickerSeconds = false;
  @Input() closeOnAutoApply = true;

  @Output() change: EventEmitter<Object> = new EventEmitter();
  @Output() rangeClicked: EventEmitter<Object> = new EventEmitter();
  @Output() datesUpdated: EventEmitter<Object> = new EventEmitter();
  @Output() startDateChanged: EventEmitter<Object> = new EventEmitter();
  @Output() endDateChanged: EventEmitter<Object> = new EventEmitter();

  _locale: LocaleConfig = {};
  private datePickerPortal: ComponentPortal<DateRangePickerComponent>;
  private overlayRef: OverlayRef;
  pickerRef: any;
  readonly componentRef: ComponentRef<DateRangePickerComponent>;
  private subscription$ = new Subject();
  static getPositions(): ConnectionPositionPair[] {
    return [
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom'
      },
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top'
      }
    ];
  }
  @Input() set locale(value) {
    this._locale = { ...this._localeService.config, ...value };
  }

  get locale(): any {
    return this._locale;
  }

  @Input() set startKey(value) {
    if (value !== null) {
      this._startKey = value;
    } else {
      this._startKey = 'startDate';
    }
  }

  @Input() set endKey(value) {
    if (value !== null) {
      this._endKey = value;
    } else {
      this._endKey = 'endDate';
    }
  }

  get value() {
    return this._value || null;
  }

  set value(val) {
    this._value = val;
    this._onChange(val);
    this._changeDetectorRef.markForCheck();
  }

  @HostBinding('disabled') get disabled() {
    return this._disabled;
  }

  @HostListener('keyup.esc') onKeyUpEscHandle() {
    this.hide();
  }

  @HostListener('blur') onBlurHandle() {
    this.onBlur();
  }

  @HostListener('click') onClickHandle() {
    this.open();
  }

  @HostListener('keyup', ['$event']) onKeyUpHandle(event) {
    this.inputChanged(event);
  }

  constructor(
    public viewContainerRef: ViewContainerRef,
    public _changeDetectorRef: ChangeDetectorRef,
    private _componentFactoryResolver: ComponentFactoryResolver,
    private _el: ElementRef,
    private _renderer: Renderer2,
    private differs: KeyValueDiffers,
    private _localeService: LocaleService,
    private elementRef: ElementRef,
    private overlay: Overlay,
    private injector: Injector
  ) {
    this.drops = 'down';
    this.opens = 'auto';
    if (this.componentRef) {
      this.componentRef.destroy();
    }
    const componentFactory = this._componentFactoryResolver.resolveComponentFactory(DateRangePickerComponent);
    this.componentRef = viewContainerRef.createComponent(componentFactory);
    viewContainerRef.clear();
    this.picker = (<DateRangePickerComponent>this.componentRef.instance);
    this.picker.inline = false; // set inline to false for all directive usage
  }

  ngOnInit() {
    this.picker.startDateChanged.asObservable().subscribe((itemChanged: any) => {
      this.startDateChanged.emit(itemChanged);
    });
    this.picker.endDateChanged.asObservable().subscribe((itemChanged: any) => {
      this.endDateChanged.emit(itemChanged);
    });
    this.picker.rangeClicked.asObservable().subscribe((range: any) => {
      this.rangeClicked.emit(range);
    });
    this.picker.datesUpdated.asObservable().subscribe((range: any) => {
      this.datesUpdated.emit(range);
    });
    this.picker.choosedDate.asObservable().subscribe((change: any) => {
      if (change) {
        const value = {};
        value[this._startKey] = change.startDate;
        value[this._endKey] = change.endDate;
        this.value = value;
        this.change.emit(value);
        if (typeof change.chosenLabel === 'string') {
          this._el.nativeElement.value = change.chosenLabel;
        }
      }
    });
    this.localeDiffer = this.differs.find(this.locale).create();
  }

  ngOnChanges(changes: SimpleChanges): void {
    for (const change in changes) {
      if (changes.hasOwnProperty(change)) {
        if (this.notForChangesProperty.indexOf(change) === -1) {
          this.picker[change] = changes[change].currentValue;
        }
      }
    }
  }

  ngDoCheck() {
    if (this.localeDiffer) {
      const changes = this.localeDiffer.diff(this.locale);
      if (changes) {
        this.picker.updateLocale(this.locale);
      }
    }
  }

  onBlur() {
    this._onTouched();
  }

  private getOverlayPosition(origin: HTMLElement): PositionStrategy {
    return this.overlay.position()
      .flexibleConnectedTo(origin)
      .withPositions(DateRangePickerDirective.getPositions())
      .withFlexibleDimensions(false)
      .withPush(false);
  }

  private getOverlayConfig({ origin }): OverlayConfig {
    return new OverlayConfig({
      hasBackdrop: true,
      backdropClass: 'popover-backdrop',
      positionStrategy: this.getOverlayPosition(origin),
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });
  }
  createInjector(useValue): Injector {
    return Injector.create({
      parent: this.injector,
      providers: [
        { provide: CONTAINER_DATA, useValue }
      ]
    })
  }
  open(event?: any) {
    if (this.disabled) {
      return;
    }

    this.datePickerPortal = new ComponentPortal(DateRangePickerComponent);
    this.overlayRef = this.overlay.create(this.getOverlayConfig({ origin: this._el.nativeElement }));
    this.overlayRef.backdropClick()
      .pipe(
        take(1),
        tap(() => this.overlayRef.detach())
      )
      .subscribe();
    this.pickerRef = this.overlayRef.attach(this.datePickerPortal);

    this.setVariables();
    this.setPosition();
  }

  private setVariables() {
    this.pickerRef.instance.showClearButton = true;
    this.pickerRef.instance.showCustomRangeLabel = true;
    this.pickerRef.instance.alwaysShowCalendars = true;
    this.pickerRef.instance.ranges = this.ranges;
    this.pickerRef.instance.emptyWeekRowClass = this.emptyWeekRowClass;
    this.pickerRef.instance.emptyWeekColumnClass = this.emptyWeekColumnClass;
    this.pickerRef.instance.firstDayOfNextMonthClass = this.firstDayOfNextMonthClass;
    this.pickerRef.instance.lastDayOfPreviousMonthClass = this.lastDayOfPreviousMonthClass;
    this.pickerRef.instance.drops = this.drops;
    this.pickerRef.instance.opens = this.opens;
    this.pickerRef.instance.closeOnAutoApply = this.closeOnAutoApply;
  }

  hide(e?) {
    this.overlayRef.detach();
    this.picker.hide(e);
  }

  toggle(e?) {
    if (this.picker.isShown) {
      this.hide(e);
    } else {
      this.open(e);
    }
  }

  clear() {
    this.picker.clear();
  }

  writeValue(value) {
    this.setValue(value);
  }

  registerOnChange(fn) {
    this._onChange = fn;
  }

  registerOnTouched(fn) {
    this._onTouched = fn;
  }

  setDisabledState(state: boolean): void {
    this._disabled = state;
  }

  private setValue(val: any) {
    if (val) {
      this.value = val;
      if (val[this._startKey]) {
        this.picker.setStartDate(val[this._startKey]);
      }
      if (val[this._endKey]) {
        this.picker.setEndDate(val[this._endKey]);
      }
      this.picker.calculateChosenLabel();
      if (this.picker.chosenLabel) {
        this._el.nativeElement.value = this.picker.chosenLabel;
      }
    } else {
      this.picker.clear();
    }
  }

  /**
   * Set position of the calendar
   */
  setPosition() {
    let style;
    let containerTop;
    const container = this.picker.pickerContainer.nativeElement;
    const element = this._el.nativeElement;
    if (this.drops && this.drops === 'up') {
      containerTop = (element.offsetTop - container.clientHeight) + 'px';
    } else {
      containerTop = 'auto';
    }
    if (this.opens === 'left') {
      style = {
        top: containerTop,
        left: (element.offsetLeft - container.clientWidth + element.clientWidth) + 'px',
        right: 'auto'
      };
    } else if (this.opens === 'center') {
      style = {
        top: containerTop,
        left: (element.offsetLeft + element.clientWidth / 2
          - container.clientWidth / 2) + 'px',
        right: 'auto'
      };
    } else if (this.opens === 'right') {
      style = {
        top: containerTop,
        left: element.offsetLeft + 'px',
        right: 'auto'
      };
    } else {
      const position = element.offsetLeft + element.clientWidth / 2 - container.clientWidth / 2;
      if (position < 0) {
        style = {
          top: containerTop,
          left: element.offsetLeft + 'px',
          right: 'auto'
        };
      } else {
        style = {
          top: containerTop,
          left: position + 'px',
          right: 'auto'
        };
      }
    }
    if (style) {
      this._renderer.setStyle(container, 'top', style.top);
      this._renderer.setStyle(container, 'left', style.left);
      this._renderer.setStyle(container, 'right', style.right);
    }
  }

  inputChanged(e) {
    if (e.target.tagName.toLowerCase() !== 'input') {
      return;
    }
    if (!e.target.value.length) {
      return;
    }
    const dateString = e.target.value.split(this.picker.locale.separator);
    let start = null, end = null;
    if (dateString.length === 2) {
      start = moment(dateString[0], this.picker.locale.format);
      end = moment(dateString[1], this.picker.locale.format);
    }
    if (this.singleDatePicker || start === null || end === null) {
      start = moment(e.target.value, this.picker.locale.format);
      end = start;
    }
    if (!start.isValid() || !end.isValid()) {
      return;
    }
    this.picker.setStartDate(start);
    this.picker.setEndDate(end);
    this.picker.updateView();

  }

  ngOnDestroy() {
    this.subscription$.next();
    this.subscription$.complete();
  }
}
