import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
}

@Component({
  selector: 'app-activity-report',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
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

  private filter: ActivityReportFilter = {
    subset: false,
    years: [1402, 1403, 1404],
    month: 12,
    period: 1
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
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
}
