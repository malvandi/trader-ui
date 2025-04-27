import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

interface TableData {
  entries: Array<{
    code: string;
    rsi: number;
    rahavardId: number;
    tehranExchangeId: string;
    domesticSellCount: Record<string, number>;
    domesticSellPrice: Record<string, number>;
    exportSellCount: Record<string, number>;
    exportSellPrice: Record<string, number>;
    totalSellCount: Record<string, number>;
    totalSellPrice: Record<string, number>;
  }>;
  month: number;
  period: number;
  total: number;
  years: string[];
}

interface ActivityReportFilter {
  subset: boolean;
  years: number[];
  month: number;
  period: number;
  sort?: {
    property: string;
    direction: 'asc' | 'desc';
  };
}

interface MonthOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-activity-report',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule, 
    FormsModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './activity-report.component.html',
  styleUrls: ['./activity-report.component.scss']
})
export class ActivityReportComponent implements OnInit {
  data: TableData = {
    entries: [],
    month: 0,
    period: 0,
    total: 0,
    years: []
  };

  availableYears: number[] = Array.from({length: 13}, (_, i) => 1392 + i);
  selectedYears: number[] = [1402, 1403, 1404];
  selectedMonth: number = 12;

  monthOptions: MonthOption[] = [
    { value: 1, label: 'فروردین' },
    { value: 2, label: 'اردیبهشت' },
    { value: 3, label: 'خرداد' },
    { value: 4, label: 'تیر' },
    { value: 5, label: 'مرداد' },
    { value: 6, label: 'شهریور' },
    { value: 7, label: 'مهر' },
    { value: 8, label: 'آبان' },
    { value: 9, label: 'آذر' },
    { value: 10, label: 'دی' },
    { value: 11, label: 'بهمن' },
    { value: 12, label: 'اسفند' }
  ];

  private filter: ActivityReportFilter = {
    subset: false,
    years: [1402, 1403, 1404],
    month: 12,
    period: 1,
    sort: {
      property: 'totalSellPrice_change.1403',
      direction: 'desc'
    }
  };

  currentSort: { property: string; direction: 'asc' | 'desc' } = {
    property: 'totalSellPrice_change.1403',
    direction: 'desc'
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadActivityReport();
  }

  onYearSelectionChange(): void {
    this.filter.years = this.selectedYears;
    this.loadActivityReport();
  }

  onMonthSelectionChange(): void {
    this.filter.month = this.selectedMonth;
    this.loadActivityReport();
  }

  loadActivityReport(): void {
    const url = `${environment.napi}/analyzer/fundamental/activity-report-growth`;
    this.http.post<TableData>(url, this.filter).subscribe({
      next: (response) => {
        console.log('Activity report loaded:', response);
        this.data = response;
      },
      error: (error) => {
        console.error('Error loading activity report:', error);
      }
    });
  }

  getChangeYear(year: string): string {
    return `change.${year}`;
  }

  getValueWithCommas(value: number | undefined | null, isPrice: boolean = false): string {
    if (value === undefined || value === null) {
      return '0';
    }

    if (isPrice) {
      const priceInBillions = value / 10000;

      if (priceInBillions < 10) {
        return priceInBillions.toFixed(2);
      } else if (priceInBillions < 100) {
        return priceInBillions.toFixed(1);
      } else if (priceInBillions < 1000) {
        return Math.round(priceInBillions).toString();
      } else {
        return Math.round(priceInBillions).toLocaleString();
      }
    }

    return value.toLocaleString();
  }

  getTooltipText(value: number | undefined | null, isPrice: boolean = false): string {
    if (value === undefined || value === null) {
      return '0';
    }
    if (isPrice) {
      return `${(value / 10000).toFixed(2)} میلیارد تومان`;
    }
    return value.toLocaleString();
  }

  getPercentage(value: number | undefined | null): string {
    if (value === undefined || value === null || !value) {
      return '0%';
    }
    return `${Math.round(value).toLocaleString()}%`;
  }

  openChart(rahavardId: number): void {
    window.open(`https://rahavard365.com/asset/${rahavardId}/chart`, '_blank');
  }

  openDetails(record: any): void {
    this.router.navigate(['/stock-details', record.rahavardId], {
      state: { record }
    });
  }

  getSortIcon(property: string): string {
    if (this.currentSort?.property === property) {
      return this.currentSort.direction === 'asc' ? '↑' : '↓';
    }
    return '';
  }

  sort(property: string): void {
    if (this.currentSort?.property === property) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort = { property, direction: 'desc' };
    }

    this.filter.sort = this.currentSort;
    this.loadActivityReport();
  }
}
