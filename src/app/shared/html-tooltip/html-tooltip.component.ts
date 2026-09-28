import { Component, Input, TemplateRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Overlay, OverlayRef, OverlayConfig } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef } from '@angular/core';
import { Subscription, fromEvent, filter } from 'rxjs';
import { NgModule } from '@angular/core';

@Component({
  selector: 'app-html-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-template #tooltipTemplate>
      <div class="html-tooltip" [class]="tooltipClass" role="tooltip">
        <div class="html-tooltip-content" [innerHTML]="content"></div>
        <div class="html-tooltip-arrow"></div>
      </div>
    </ng-template>
  `,
  styles: [`
    .html-tooltip {
      position: absolute;
      max-width: 300px;
      padding: 10px 12px;
      background-color: #333;
      color: #fff;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: 'IRANSans', 'Vazirmatn', 'Tahoma', sans-serif;
      font-size: 12px;
      line-height: 1.5;
      direction: rtl;
      text-align: right;
      z-index: 1000;
      pointer-events: none;
    }

    .html-tooltip-content {
      white-space: pre-wrap;
    }

    .html-tooltip-arrow {
      position: absolute;
      width: 0;
      height: 0;
      border: 6px solid transparent;
    }

    /* Position classes */
    .html-tooltip.top .html-tooltip-arrow {
      bottom: -12px;
      left: 50%;
      transform: translateX(-50%);
      border-top-color: #333;
    }

    .html-tooltip.bottom .html-tooltip-arrow {
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      border-bottom-color: #333;
    }

    .html-tooltip.left .html-tooltip-arrow {
      right: -12px;
      top: 50%;
      transform: translateY(-50%);
      border-left-color: #333;
    }

    .html-tooltip.right .html-tooltip-arrow {
      left: -12px;
      top: 50%;
      transform: translateY(-50%);
      border-right-color: #333;
    }
  `]
})
export class HtmlTooltipComponent implements AfterViewInit, OnDestroy {
  @ViewChild('tooltipTemplate', { read: TemplateRef }) tooltipTemplate!: TemplateRef<any>;
  
  @Input() content: string = '';
  @Input() tooltipClass: string = '';
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  @Input() showDelay: number = 200;
  @Input() hideDelay: number = 100;

  private overlayRef: OverlayRef | null = null;
  private portal: TemplatePortal<any> | null = null;
  private showTimeout: any;
  private hideTimeout: any;
  private subscriptions: Subscription[] = [];
  private isHoveringTrigger = false;
  private isHoveringTooltip = false;

  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.portal = new TemplatePortal(this.tooltipTemplate, this.viewContainerRef);
  }

  ngOnDestroy(): void {
    this.clearTimeouts();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.disposeOverlay();
  }

  show(): void {
    this.clearTimeouts();
    this.showTimeout = setTimeout(() => {
      if (this.isHoveringTrigger) {
        this.createOverlay();
      }
    }, this.showDelay);
  }

  hide(): void {
    this.clearTimeouts();
    this.hideTimeout = setTimeout(() => {
      if (!this.isHoveringTooltip) {
        this.disposeOverlay();
      }
    }, this.hideDelay);
  }

  onTriggerEnter(): void {
    this.isHoveringTrigger = true;
    this.show();
  }

  onTriggerLeave(): void {
    this.isHoveringTrigger = false;
    this.hide();
  }

  onTooltipEnter(): void {
    this.isHoveringTooltip = true;
    this.clearTimeouts();
  }

  onTooltipLeave(): void {
    this.isHoveringTooltip = false;
    this.hide();
  }

  private createOverlay(): void {
    if (this.overlayRef || !this.portal) return;

    const config = new OverlayConfig({
      positionStrategy: this.overlay.position()
        .flexibleConnectedTo(this.viewContainerRef.element.nativeElement)
        .withPositions(this.getPositions())
        .withPush(true),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false
    });

    this.overlayRef = this.overlay.create(config);
    this.overlayRef.attach(this.portal);

    // Add hover listeners to tooltip element
    const tooltipElement = this.overlayRef.overlayElement.querySelector('.html-tooltip');
    if (tooltipElement) {
      const enterSub = fromEvent(tooltipElement, 'mouseenter').subscribe(() => this.onTooltipEnter());
      const leaveSub = fromEvent(tooltipElement, 'mouseleave').subscribe(() => this.onTooltipLeave());
      this.subscriptions.push(enterSub, leaveSub);
    }

    // Close on click outside
    const clickSub = fromEvent(document, 'click')
      .pipe(filter(() => this.overlayRef !== null))
      .subscribe(() => this.disposeOverlay());
    this.subscriptions.push(clickSub);
  }

  private getPositions() {
    const positions = [
      {
        originX: 'center', originY: 'top',
        overlayX: 'center', overlayY: 'bottom',
        offsetY: -8,
        panelClass: 'top'
      },
      {
        originX: 'center', originY: 'bottom',
        overlayX: 'center', overlayY: 'top',
        offsetY: 8,
        panelClass: 'bottom'
      },
      {
        originX: 'start', originY: 'center',
        overlayX: 'end', overlayY: 'center',
        offsetX: -8,
        panelClass: 'left'
      },
      {
        originX: 'end', originY: 'center',
        overlayX: 'start', overlayY: 'center',
        offsetX: 8,
        panelClass: 'right'
      }
    ];

    // Reorder based on preferred position
    const preferredIndex = positions.findIndex(p => p.panelClass === this.position);
    if (preferredIndex > 0) {
      const [preferred] = positions.splice(preferredIndex, 1);
      positions.unshift(preferred);
    }

    return positions;
  }

  private disposeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  private clearTimeouts(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}

@NgModule({
  declarations: [HtmlTooltipComponent],
  exports: [HtmlTooltipComponent]
})
export class HtmlTooltipModule {}

@Component({
  selector: 'app-html-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-template #tooltipTemplate>
      <div class="html-tooltip" [class]="tooltipClass" role="tooltip">
        <div class="html-tooltip-content" [innerHTML]="content"></div>
        <div class="html-tooltip-arrow"></div>
      </div>
    </ng-template>
  `,
  styles: [`
    .html-tooltip {
      position: absolute;
      max-width: 300px;
      padding: 10px 12px;
      background-color: #333;
      color: #fff;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: 'IRANSans', 'Vazirmatn', 'Tahoma', sans-serif;
      font-size: 12px;
      line-height: 1.5;
      direction: rtl;
      text-align: right;
      z-index: 1000;
      pointer-events: none;
    }

    .html-tooltip-content {
      white-space: pre-wrap;
    }

    .html-tooltip-arrow {
      position: absolute;
      width: 0;
      height: 0;
      border: 6px solid transparent;
    }

    /* Position classes */
    .html-tooltip.top .html-tooltip-arrow {
      bottom: -12px;
      left: 50%;
      transform: translateX(-50%);
      border-top-color: #333;
    }

    .html-tooltip.bottom .html-tooltip-arrow {
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      border-bottom-color: #333;
    }

    .html-tooltip.left .html-tooltip-arrow {
      right: -12px;
      top: 50%;
      transform: translateY(-50%);
      border-left-color: #333;
    }

    .html-tooltip.right .html-tooltip-arrow {
      left: -12px;
      top: 50%;
      transform: translateY(-50%);
      border-right-color: #333;
    }
  `]
})
export class HtmlTooltipComponent implements AfterViewInit, OnDestroy {
  @ViewChild('tooltipTemplate', { read: TemplateRef }) tooltipTemplate!: TemplateRef<any>;
  
  @Input() content: string = '';
  @Input() tooltipClass: string = '';
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  @Input() showDelay: number = 200;
  @Input() hideDelay: number = 100;

  private overlayRef: OverlayRef | null = null;
  private portal: TemplatePortal<any> | null = null;
  private showTimeout: any;
  private hideTimeout: any;
  private subscriptions: Subscription[] = [];
  private isHoveringTrigger = false;
  private isHoveringTooltip = false;

  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.portal = new TemplatePortal(this.tooltipTemplate, this.viewContainerRef);
  }

  ngOnDestroy(): void {
    this.clearTimeouts();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.disposeOverlay();
  }

  show(): void {
    this.clearTimeouts();
    this.showTimeout = setTimeout(() => {
      if (this.isHoveringTrigger) {
        this.createOverlay();
      }
    }, this.showDelay);
  }

  hide(): void {
    this.clearTimeouts();
    this.hideTimeout = setTimeout(() => {
      if (!this.isHoveringTooltip) {
        this.disposeOverlay();
      }
    }, this.hideDelay);
  }

  onTriggerEnter(): void {
    this.isHoveringTrigger = true;
    this.show();
  }

  onTriggerLeave(): void {
    this.isHoveringTrigger = false;
    this.hide();
  }

  onTooltipEnter(): void {
    this.isHoveringTooltip = true;
    this.clearTimeouts();
  }

  onTooltipLeave(): void {
    this.isHoveringTooltip = false;
    this.hide();
  }

  private createOverlay(): void {
    if (this.overlayRef || !this.portal) return;

    const config = new OverlayConfig({
      positionStrategy: this.overlay.position()
        .flexibleConnectedTo(this.viewContainerRef.element.nativeElement)
        .withPositions(this.getPositions())
        .withPush(true),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false
    });

    this.overlayRef = this.overlay.create(config);
    this.overlayRef.attach(this.portal);

    // Add hover listeners to tooltip element
    const tooltipElement = this.overlayRef.overlayElement.querySelector('.html-tooltip');
    if (tooltipElement) {
      const enterSub = fromEvent(tooltipElement, 'mouseenter').subscribe(() => this.onTooltipEnter());
      const leaveSub = fromEvent(tooltipElement, 'mouseleave').subscribe(() => this.onTooltipLeave());
      this.subscriptions.push(enterSub, leaveSub);
    }

    // Close on click outside
    const clickSub = fromEvent(document, 'click')
      .pipe(filter(() => this.overlayRef !== null))
      .subscribe(() => this.disposeOverlay());
    this.subscriptions.push(clickSub);
  }

  private getPositions() {
    const positions = [
      {
        originX: 'center', originY: 'top',
        overlayX: 'center', overlayY: 'bottom',
        offsetY: -8,
        panelClass: 'top'
      },
      {
        originX: 'center', originY: 'bottom',
        overlayX: 'center', overlayY: 'top',
        offsetY: 8,
        panelClass: 'bottom'
      },
      {
        originX: 'start', originY: 'center',
        overlayX: 'end', overlayY: 'center',
        offsetX: -8,
        panelClass: 'left'
      },
      {
        originX: 'end', originY: 'center',
        overlayX: 'start', overlayY: 'center',
        offsetX: 8,
        panelClass: 'right'
      }
    ];

    // Reorder based on preferred position
    const preferredIndex = positions.findIndex(p => p.panelClass === this.position);
    if (preferredIndex > 0) {
      const [preferred] = positions.splice(preferredIndex, 1);
      positions.unshift(preferred);
    }

    return positions;
  }

  private disposeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  private clearTimeouts(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}
