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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import { OverlayModule } from '@angular/cdk/overlay';
import { HtmlTooltipDirective } from '../../shared/html-tooltip/html-tooltip.directive';

const PRESETS_STORAGE_KEY = 'market-online-status-filter-presets';

interface StockGroup {
  name: string;
  translate: string;
}

function getDefaultPresets(): FilterPreset[] {
  return [
    {
      name: 'Project 1',
      filters: {
        humanPower: 2,
        isBuyQueue: true,
        isSellQueue: false
      }
    },
    {
      name: 'Project 2',
      filters: {
        humanMoneyInflow: 3,
        suspiciousTradingVolume: 5
      }
    }
  ];
}

function loadPresetsFromStorage(): FilterPreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading presets from localStorage:', e);
  }
  return getDefaultPresets();
}

function savePresetsToStorage(presets: FilterPreset[]): void {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Error saving presets to localStorage:', e);
  }
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
  isBuyQueue?: boolean;
  isSellQueue?: boolean;
  page: number;
  limit: number;
}

interface FilterPreset {
  name: string;
  filters: Partial<MarketOnlineFilter>;
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
        MatTooltipModule,
        MatDialogModule,
        MatCardContent,
        MatCard,
        MatCardTitle,
        MatCardHeader,
        OverlayModule,
        HtmlTooltipDirective
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

  // Filter panel state
  filtersExpanded = true;

  // Tooltip texts
  humanPowerTooltip = '<strong>سرانه خرید/فروش حقیقی:</strong> تعداد سهم خرید/فروش تقسیم بر تعداد خریدار/فروشنده.<br>' +
      '<strong>قدرت حقیقی:</strong> در صورتی که خریداران قویتری داشته باشد، از تقسیم سرانه خرید به سرانه فروش بدست می آید، در غیر اینصورت از تقسیم سرانه فروش به سرانه خرید همراه با یک منفی';

  // Filter Presets
  projectFilters: FilterPreset[] = [];

  selectedPreset: string | null = null;

  constructor(private http: HttpClient, private dialog: MatDialog) {
    this.projectFilters = loadPresetsFromStorage();
  }

  toggleFilters(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  ngOnInit(): void {
    this.loadGroups();
    this.loadMarketData();
  }

  applyPreset(presetName: string): void {
    const preset = this.projectFilters.find(p => p.name === presetName);
    if (!preset) return;

    const filters = preset.filters;

    // Reset all filters first
    this.clearFiltersWithoutReload();

    // Apply preset values
    if (filters.group !== undefined) {
      this.selectedGroups = filters.group || [];
    }
    if (filters.humanPower !== undefined) {
      this.humanPower = filters.humanPower;
    }
    if (filters.humanMoneyInflow !== undefined) {
      this.humanMoneyInflow = filters.humanMoneyInflow;
    }
    if (filters.suspiciousTradingVolume !== undefined) {
      this.suspiciousTradingVolume = filters.suspiciousTradingVolume;
    }
    if (filters.isNegativeLast5Days !== undefined) {
      this.isNegativeLast5Days = filters.isNegativeLast5Days;
    }
    if (filters.isBuyQueue !== undefined) {
      this.isBuyQueue = filters.isBuyQueue;
    }
    if (filters.isSellQueue !== undefined) {
      this.isSellQueue = filters.isSellQueue;
    }

    this.selectedPreset = presetName;
    this.onFilterChange();
  }

  clearFiltersWithoutReload(): void {
    this.selectedGroups = [];
    this.humanPower = null;
    this.humanMoneyInflow = null;
    this.suspiciousTradingVolume = null;
    this.isNegativeLast5Days = null;
    this.isBuyQueue = null;
    this.isSellQueue = null;
    this.selectedPreset = null;
  }

  saveCurrentFiltersAsPreset(): void {
    const name = prompt('نام پیش‌تنظیم جدید را وارد کنید:');
    if (!name || !name.trim()) return;

    const trimmedName = name.trim();

    // Check if preset with this name already exists
    const existingIndex = this.projectFilters.findIndex(p => p.name === trimmedName);

    const currentFilters: Partial<MarketOnlineFilter> = {};

    if (this.selectedGroups.length > 0) {
      currentFilters.group = [...this.selectedGroups];
    }
    if (this.humanPower !== null && this.humanPower !== undefined) {
      currentFilters.humanPower = this.humanPower;
    }
    if (this.humanMoneyInflow !== null && this.humanMoneyInflow !== undefined) {
      currentFilters.humanMoneyInflow = this.humanMoneyInflow;
    }
    if (this.suspiciousTradingVolume !== null && this.suspiciousTradingVolume !== undefined) {
      currentFilters.suspiciousTradingVolume = this.suspiciousTradingVolume;
    }
    if (this.isNegativeLast5Days !== null) {
      currentFilters.isNegativeLast5Days = this.isNegativeLast5Days;
    }
    if (this.isBuyQueue !== null) {
      currentFilters.isBuyQueue = this.isBuyQueue;
    }
    if (this.isSellQueue !== null) {
      currentFilters.isSellQueue = this.isSellQueue;
    }

    const newPreset: FilterPreset = {
      name: trimmedName,
      filters: currentFilters
    };

    if (existingIndex >= 0) {
      this.projectFilters[existingIndex] = newPreset;
    } else {
      this.projectFilters.push(newPreset);
    }

    savePresetsToStorage(this.projectFilters);
    this.selectedPreset = trimmedName;
  }

  onPresetSelectionChange(presetName: string): void {
    if (presetName) {
      this.applyPreset(presetName);
    } else {
      this.selectedPreset = null;
    }
  }

  deletePreset(presetName: string): void {
    this.projectFilters = this.projectFilters.filter(p => p.name !== presetName);
    savePresetsToStorage(this.projectFilters);
    if (this.selectedPreset === presetName) {
      this.selectedPreset = null;
    }
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
      filter.isBuyQueue = this.isBuyQueue;
    }
    if (this.isSellQueue !== null) {
      filter.isSellQueue = this.isSellQueue;
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
    this.clearFiltersWithoutReload();
    this.currentPage = 0;
    this.loadMarketData();
  }

  getGroupTranslate(groupName: string): string {
    const group = this.groups.find(g => g.name === groupName);
    return group ? group.translate : groupName;
  }

  getSelectedGroupsDisplay(): string {
    if (this.selectedGroups.length === 0) {
      return 'همه گروه‌ها';
    }
    return this.selectedGroups.map(g => this.getGroupTranslate(g)).join(', ');
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

  formatPeValue(value: number | undefined | null): string {
    if (value === undefined || value === null || value <= 0) {
      return '-';
    }
    return this.formatNumber(value);
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

  trackByFn(index: number, item: number): number {
    return item;
  }
}
