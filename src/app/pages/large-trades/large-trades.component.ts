import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatDatepickerInput, MatDatepickerToggle, MatDatepicker} from '@angular/material/datepicker';
import {provideNativeDateAdapter} from '@angular/material/core';
import {environment} from '../../../environments/environment';

export interface LargeTradeRequest {
  code: string;
  minAmount: number;
  tradedAt?: {
    from?: string;
    to?: string;
  };
  type: 'BUY' | 'SELL';
  sort: {
    propertyName: string;
    direction: 'ASC' | 'DESC';
  };
  page: number;
  limit: number;
}

export interface LargeTradeRecord {
  code: string;
  amount: number;
  type: 'BUY' | 'SELL';
  totalVolume: number;
  totalTradeCounts: number;
  lastPrice: number;
  id: number;
  createdAt: string;
}

export interface LargeTradeResponse {
  records: LargeTradeRecord[];
  total: number;
}

interface UiFilters {
  code: string;
  minAmount: number | null;
  tradedAtFrom: Date | null;
  tradedAtTo: Date | null;
  type: 'BUY' | 'SELL';
}

const DEFAULT_UI_FILTERS: UiFilters = {
  code: '',
  minAmount: 200,
  tradedAtFrom: null,
  tradedAtTo: null,
  type: 'BUY'
};

const DEFAULT_API_FILTERS: Omit<LargeTradeRequest, 'page' | 'limit'> = {
  code: '',
  minAmount: 2000000000,
  type: 'BUY',
  sort: {
    propertyName: 'amount',
    direction: 'DESC'
  }
};

const TRADE_TYPE_LABELS: Record<'BUY' | 'SELL', string> = {
  BUY: 'خرید',
  SELL: 'فروش'
};

const RIALS_PER_MILLION_TOMAN = 10_000_000;

@Component({
  selector: 'app-large-trades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDatepicker
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './large-trades.component.html',
  styleUrls: ['./large-trades.component.scss']
})
export class LargeTradesComponent implements OnInit {
  uiFilters: UiFilters = {...DEFAULT_UI_FILTERS};
  records: LargeTradeRecord[] = [];
  totalRecords = 0;
  isLoading = false;
  errorMessage: string | null = null;

  tradeTypeOptions = [
    {value: 'BUY', label: 'خرید'},
    {value: 'SELL', label: 'فروش'}
  ];

  currentPage = 0;
  pageSize = 10;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadLargeTrades();
  }

  private buildApiRequest(): LargeTradeRequest {
    const request: LargeTradeRequest = {
      ...DEFAULT_API_FILTERS,
      code: this.uiFilters.code,
      minAmount: this.uiFilters.minAmount !== null && this.uiFilters.minAmount !== undefined
        ? this.millionTomansToRials(this.uiFilters.minAmount)
        : DEFAULT_API_FILTERS.minAmount,
      type: this.uiFilters.type,
      page: this.currentPage,
      limit: this.pageSize
    };

    const hasFromDate = this.uiFilters.tradedAtFrom !== null;
    const hasToDate = this.uiFilters.tradedAtTo !== null;

    if (hasFromDate || hasToDate) {
      request.tradedAt = {};
      if (hasFromDate) {
        request.tradedAt.from = this.formatDateForApi(this.uiFilters.tradedAtFrom!, true);
      }
      if (hasToDate) {
        request.tradedAt.to = this.formatDateForApi(this.uiFilters.tradedAtTo!, false);
      }
    }

    return request;
  }

  private formatDateForApi(date: Date, isFromDate: boolean): string {
    try {
      const d = new Date(date);
      if (isFromDate) {
        // Start of day: 00:00:00.000
        d.setHours(0, 0, 0, 0);
      } else {
        // End of day: 23:59:59.999
        d.setHours(23, 59, 59, 999);
      }
      return d.toISOString();
    } catch {
      return date.toISOString();
    }
  }

  millionTomansToRials(millionTomans: number): number {
    return Math.round(millionTomans * RIALS_PER_MILLION_TOMAN);
  }

  rialsToMillionTomans(rials: number): number {
    return rials / RIALS_PER_MILLION_TOMAN;
  }

  loadLargeTrades(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const request = this.buildApiRequest();
    const url = `${environment.ktapi}/market/large-trades`;

    this.http.post<LargeTradeResponse>(url, request).subscribe({
      next: (response) => {
        this.records = response.records;
        this.totalRecords = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading large trades:', error);
        this.errorMessage = 'خطا در بارگذاری داده‌ها. لطفاً دوباره تلاش کنید.';
        this.isLoading = false;
      }
    });
  }

  onFilterSubmit(): void {
    this.currentPage = 0;
    this.loadLargeTrades();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadLargeTrades();
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  get pages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];

    const start = Math.max(0, current - 2);
    const end = Math.min(total - 1, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  formatNumber(value: number): string {
    if (value === undefined || value === null) {
      return '';
    }
    return value.toLocaleString('fa-IR');
  }

  formatAmount(value: number): string {
    if (value === undefined || value === null) {
      return '';
    }
    const millionTomans = this.rialsToMillionTomans(value);
    return millionTomans.toLocaleString('fa-IR', {minimumFractionDigits: 0, maximumFractionDigits: 0});
  }

  formatMinAmountInput(value: number | null): string {
    if (value === null || value === undefined) {
      return '';
    }
    return value.toLocaleString('fa-IR');
  }

  getTradeTypeLabel(type: 'BUY' | 'SELL'): string {
    return TRADE_TYPE_LABELS[type] || type;
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return dateString;
    }
  }

  trackById(index: number, record: LargeTradeRecord): number {
    return record.id;
  }
}
