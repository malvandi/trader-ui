import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../environments/environment';

interface StockGroup {
  name: string;
  translate: string;
}

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  last: number;
  volume: number;
  tradeCount: number;
  tradeValue: number;
  minAllowedPrice: number;
  maxAllowedPrice: number;
  timestamp: string;
}

interface HumanOrderStatistics {
  buyVolume: number;
  buyCount: number;
  sellVolume: number;
  sellCount: number;
}

interface AnalysisData {
  humanPower: number;
  humanMoneyInflow: number;
  suspiciousTradingVolume: number;
  negativeDays: number;
  buyQueue: boolean;
  sellQueue: boolean;
}

interface MarketRecord {
  tehranExchangeId: string;
  code: string;
  name: string;
  group: string;
  candle: CandleData;
  eps: number;
  pOnE: number;
  groupPOnE: number;
  baseVolume: number;
  humanOrderStatistics: HumanOrderStatistics;
  analysis: AnalysisData;
}

interface MarketOnlineResponse {
  records: MarketRecord[];
  total: number;
}

interface MarketOnlineFilter {
  group?: string[];
  humanPower?: number;
  humanMoneyInflow?: number;
  suspiciousTradingVolume?: number;
  isNegativeLast5Days?: boolean;
  isBuyQueue_?: boolean;
  isSellQueue_?: boolean;
  page: number;
  limit: number;
}

@Component({
  selector: 'app-market-online-status',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './market-online-status.component.html',
  styleUrl: './market-online-status.component.scss'
})
export class MarketOnlineStatusComponent implements OnInit {
  // Data
  data: MarketRecord[] = [];
  totalRecords = 0;
  isLoading = false;
  groups: StockGroup[] = [];
  
  // Pagination
  currentPage = 0;
  pageSize = 30;
  totalPages = 0;
  
  // Filters
  selectedGroups: string[] = [];
  humanPower: number | null = null;
  humanMoneyInflow: number | null = null;
  suspiciousTradingVolume: number | null = null;
  isNegativeLast5Days: boolean | null = null;
  isBuyQueue: boolean | null = null;
  isSellQueue: boolean | null = null;

  // Boolean filter options
  booleanOptions = [
    { value: null, label: 'بدون فیلتر' },
    { value: true, label: 'بله' },
    { value: false, label: 'خیر' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadGroups();
    this.loadMarketData();
  }

  loadGroups(): void {
    this.http.get<StockGroup[]>(`${environment.ktapi}/stock/groups`).subscribe({
      next: (groups) => {
        this.groups = groups;
      },
      error: (error) => {
        console.error('Error loading groups:', error);
      }
    });
  }

  loadMarketData(): void {
    this.isLoading = true;
    const filter = this.buildFilter();
    
    this.http.post<MarketOnlineResponse>(`${environment.ktapi}/online-market`, filter).subscribe({
      next: (response) => {
        this.data = response.records;
        this.totalRecords = response.total;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading market online status:', error);
        this.isLoading = false;
      }
    });
  }

  buildFilter(): MarketOnlineFilter {
    const filter: MarketOnlineFilter = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.selectedGroups.length > 0) {
      filter.group = this.selectedGroups;
    }
    if (this.humanPower !== null && this.humanPower !== undefined) {
      filter.humanPower = this.humanPower;
    }
    if (this.humanMoneyInflow !== null && this.humanMoneyInflow !== undefined) {
      filter.humanMoneyInflow = this.humanMoneyInflow;
    }
    if (this.suspiciousTradingVolume !== null && this.suspiciousTradingVolume !== undefined) {
      filter.suspiciousTradingVolume = this.suspiciousTradingVolume;
    }
    if (this.isNegativeLast5Days !== null) {
      filter.isNegativeLast5Days = this.isNegativeLast5Days;
    }
    if (this.isBuyQueue !== null) {
      filter.isBuyQueue_ = this.isBuyQueue;
    }
    if (this.isSellQueue !== null) {
      filter.isSellQueue_ = this.isSellQueue;
    }

    return filter;
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadMarketData();
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadMarketData();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadMarketData();
  }

  clearFilters(): void {
    this.selectedGroups = [];
    this.humanPower = null;
    this.humanMoneyInflow = null;
    this.suspiciousTradingVolume = null;
    this.isNegativeLast5Days = null;
    this.isBuyQueue = null;
    this.isSellQueue = null;
    this.currentPage = 0;
    this.loadMarketData();
  }

  getGroupTranslate(groupName: string): string {
    const group = this.groups.find(g => g.name === groupName);
    return group ? group.translate : groupName;
  }

  formatNumber(value: number | undefined | null): string {
    if (value === undefined || value === null) {
      return '';
    }
    return value.toLocaleString();
  }

  formatPrice(value: number | undefined | null): string {
    if (value === undefined || value === null) {
      return '';
    }
    return (value / 10).toLocaleString(); // Assuming prices are in Rials, convert to Tomans
  }

  formatVolume(value: number | undefined | null): string {
    if (value === undefined || value === null) {
      return '';
    }
    return value.toLocaleString();
  }

  formatAnalysisValue(value: number | undefined | null): string {
    if (value === undefined || value === null) {
      return '';
    }
    return value.toFixed(2);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(0, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  trackByTehranExchangeId(index: number, record: MarketRecord): string {
    return record.tehranExchangeId;
  }
}
