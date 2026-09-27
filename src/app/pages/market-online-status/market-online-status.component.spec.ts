import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketOnlineStatusComponent } from './market-online-status.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from '../../../environments/environment';

describe('MarketOnlineStatusComponent', () => {
  let component: MarketOnlineStatusComponent;
  let fixture: ComponentFixture<MarketOnlineStatusComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MarketOnlineStatusComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MarketOnlineStatusComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load groups on init', () => {
    const mockGroups = [
      { name: 'BASIC_METALS', translate: 'فلزات اساسی' },
      { name: 'COMPUTER', translate: 'کامپیوتر' }
    ];

    fixture.detectChanges();

    const groupsReq = httpMock.expectOne(`${environment.ktapi}/stock/groups`);
    expect(groupsReq.request.method).toBe('GET');
    groupsReq.flush(mockGroups);

    expect(component.groups).toEqual(mockGroups);
  });

  it('should load market data on init', () => {
    const mockGroups = [{ name: 'BASIC_METALS', translate: 'فلزات اساسی' }];
    const mockResponse = {
      records: [{
        tehranExchangeId: '123',
        code: 'TEST',
        name: 'تست',
        group: 'BASIC_METALS',
        candle: {
          open: 1000,
          high: 1100,
          low: 900,
          close: 1050,
          last: 1050,
          volume: 10000,
          tradeCount: 50,
          tradeValue: 10500000,
          minAllowedPrice: 900,
          maxAllowedPrice: 1100,
          timestamp: new Date().toISOString()
        },
        eps: 100,
        pOnE: 10,
        groupPOnE: 12,
        baseVolume: 1,
        humanOrderStatistics: {
          buyVolume: 5000,
          buyCount: 25,
          sellVolume: 5000,
          sellCount: 25
        },
        analysis: {
          humanPower: 1.5,
          humanMoneyInflow: 0.5,
          suspiciousTradingVolume: 0.1,
          negativeDays: 2,
          buyQueue: true,
          sellQueue: false
        }
      }],
      total: 1
    };

    fixture.detectChanges();

    const groupsReq = httpMock.expectOne(`${environment.ktapi}/stock/groups`);
    groupsReq.flush(mockGroups);

    const dataReq = httpMock.expectOne(`${environment.ktapi}/online-market`);
    expect(dataReq.request.method).toBe('POST');
    expect(dataReq.request.body.page).toBe(0);
    expect(dataReq.request.body.limit).toBe(30);
    dataReq.flush(mockResponse);

    expect(component.data.length).toBe(1);
    expect(component.totalRecords).toBe(1);
    expect(component.totalPages).toBe(1);
  });

  it('should build filter correctly with all values', () => {
    component.selectedGroups = ['BASIC_METALS', 'COMPUTER'];
    component.humanPower = 2.5;
    component.humanMoneyInflow = 1.2;
    component.suspiciousTradingVolume = 0.5;
    component.isNegativeLast5Days = true;
    component.isBuyQueue = false;
    component.isSellQueue = true;
    component.currentPage = 1;
    component.pageSize = 20;

    const filter = component.buildFilter();

    expect(filter.group).toEqual(['BASIC_METALS', 'COMPUTER']);
    expect(filter.humanPower).toBe(2.5);
    expect(filter.humanMoneyInflow).toBe(1.2);
    expect(filter.suspiciousTradingVolume).toBe(0.5);
    expect(filter.isNegativeLast5Days).toBe(true);
    expect(filter.isBuyQueue_).toBe(false);
    expect(filter.isSellQueue_).toBe(true);
    expect(filter.page).toBe(1);
    expect(filter.limit).toBe(20);
  });

  it('should not include null/undefined values in filter', () => {
    component.selectedGroups = [];
    component.humanPower = null;
    component.humanMoneyInflow = null;
    component.suspiciousTradingVolume = null;
    component.isNegativeLast5Days = null;
    component.isBuyQueue = null;
    component.isSellQueue = null;

    const filter = component.buildFilter();

    expect(filter.group).toBeUndefined();
    expect(filter.humanPower).toBeUndefined();
    expect(filter.humanMoneyInflow).toBeUndefined();
    expect(filter.suspiciousTradingVolume).toBeUndefined();
    expect(filter.isNegativeLast5Days).toBeUndefined();
    expect(filter.isBuyQueue_).toBeUndefined();
    expect(filter.isSellQueue_).toBeUndefined();
  });

  it('should reset to first page on filter change', () => {
    component.currentPage = 2;
    component.onFilterChange();
    expect(component.currentPage).toBe(0);
  });

  it('should clear all filters', () => {
    component.selectedGroups = ['BASIC_METALS'];
    component.humanPower = 2.5;
    component.humanMoneyInflow = 1.2;
    component.suspiciousTradingVolume = 0.5;
    component.isNegativeLast5Days = true;
    component.isBuyQueue = true;
    component.isSellQueue = false;
    component.currentPage = 2;

    component.clearFilters();

    expect(component.selectedGroups).toEqual([]);
    expect(component.humanPower).toBeNull();
    expect(component.humanMoneyInflow).toBeNull();
    expect(component.suspiciousTradingVolume).toBeNull();
    expect(component.isNegativeLast5Days).toBeNull();
    expect(component.isBuyQueue).toBeNull();
    expect(component.isSellQueue).toBeNull();
    expect(component.currentPage).toBe(0);
  });

  it('should get group translate correctly', () => {
    component.groups = [
      { name: 'BASIC_METALS', translate: 'فلزات اساسی' },
      { name: 'COMPUTER', translate: 'کامپیوتر' }
    ];

    expect(component.getGroupTranslate('BASIC_METALS')).toBe('فلزات اساسی');
    expect(component.getGroupTranslate('COMPUTER')).toBe('کامپیوتر');
    expect(component.getGroupTranslate('UNKNOWN')).toBe('UNKNOWN');
  });

  it('should generate page numbers correctly', () => {
    component.totalPages = 10;
    component.currentPage = 4;

    const pages = component.getPageNumbers();
    expect(pages).toEqual([2, 3, 4, 5, 6]);
  });

  it('should handle edge cases for page numbers', () => {
    component.totalPages = 3;
    component.currentPage = 0;
    expect(component.getPageNumbers()).toEqual([0, 1, 2]);

    component.currentPage = 2;
    expect(component.getPageNumbers()).toEqual([0, 1, 2]);
  });
});
