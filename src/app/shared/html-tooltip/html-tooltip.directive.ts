import { Directive, Input, HostListener, ElementRef, inject, DestroyRef } from '@angular/core';
import { Overlay, OverlayRef, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { HtmlTooltipComponent } from './html-tooltip.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, filter } from 'rxjs';

@Directive({
  selector: '[appHtmlTooltip]',
  standalone: true
})
export class HtmlTooltipDirective {
  @Input('appHtmlTooltip') content: string = '';
  @Input() tooltipClass: string = '';
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  @Input() showDelay: number = 200;
  @Input() hideDelay: number = 100;

  private overlay = inject(Overlay);
  private elementRef = inject(ElementRef);
  private destroyRef = inject(DestroyRef);
  
  private overlayRef: OverlayRef | null = null;
  private showTimeout: any;
  private hideTimeout: any;
  private isHoveringTrigger = false;
  private isHoveringTooltip = false;

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.isHoveringTrigger = true;
    this.show();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.isHoveringTrigger = false;
    this.hide();
  }

  private show(): void {
    this.clearTimeouts();
    this.showTimeout = setTimeout(() => {
      if (this.isHoveringTrigger && !this.overlayRef) {
        this.createOverlay();
      }
    }, this.showDelay);
  }

  private hide(): void {
    this.clearTimeouts();
    this.hideTimeout = setTimeout(() => {
      if (!this.isHoveringTooltip) {
        this.disposeOverlay();
      }
    }, this.hideDelay);
  }

  private createOverlay(): void {
    const config = new OverlayConfig({
      positionStrategy: this.overlay.position()
        .flexibleConnectedTo(this.elementRef)
        .withPositions(this.getPositions())
        .withPush(true),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false
    });

    this.overlayRef = this.overlay.create(config);
    
    const portal = new ComponentPortal(HtmlTooltipComponent);
    const componentRef = this.overlayRef.attach(portal);
    
    // Set inputs
    componentRef.instance.content = this.content;
    componentRef.instance.tooltipClass = this.tooltipClass;
    componentRef.instance.position = this.position;
    componentRef.instance.showDelay = this.showDelay;
    componentRef.instance.hideDelay = this.hideDelay;
    
    componentRef.changeDetectorRef.detectChanges();

    // Add hover listeners to tooltip element
    const tooltipElement = this.overlayRef.overlayElement.querySelector('.html-tooltip');
    if (tooltipElement) {
      fromEvent(tooltipElement, 'mouseenter')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.isHoveringTooltip = true;
          this.clearTimeouts();
        });
      
      fromEvent(tooltipElement, 'mouseleave')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.isHoveringTooltip = false;
          this.hide();
        });
    }

    // Close on click outside
    fromEvent(document, 'click')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => this.overlayRef !== null)
      )
      .subscribe(() => this.disposeOverlay());
  }

  private getPositions() {
    const positions = [
      {
        originX: 'center' as const, originY: 'top' as const,
        overlayX: 'center' as const, overlayY: 'bottom' as const,
        offsetY: -8,
        panelClass: 'top'
      },
      {
        originX: 'center' as const, originY: 'bottom' as const,
        overlayX: 'center' as const, overlayY: 'top' as const,
        offsetY: 8,
        panelClass: 'bottom'
      },
      {
        originX: 'start' as const, originY: 'center' as const,
        overlayX: 'end' as const, overlayY: 'center' as const,
        offsetX: -8,
        panelClass: 'left'
      },
      {
        originX: 'end' as const, originY: 'center' as const,
        overlayX: 'start' as const, overlayY: 'center' as const,
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
