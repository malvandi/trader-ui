import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TableData {
  records: Array<{
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

@Component({
  selector: 'app-activity-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-report.component.html',
  styleUrls: ['./activity-report.component.scss']
})
export class ActivityReportComponent {
  data: TableData = {
    records: [
      {
        code: "قشکر",
        rsi: 0,
        rahavardId: 224,
        tehranExchangeId: "35964395659427029",
        domesticSellCount: {
          "1402": 2000,
          "1403": 2000,
          "change.1403": 0
        },
        domesticSellPrice: {
          "1402": 90819,
          "1403": 1067615,
          "change.1403": 1075.5414615884342
        },
        exportSellCount: {
          "1402": 2000,
          "1403": 2000,
          "change.1403": 0
        },
        exportSellPrice: {
          "1402": 10,
          "1403": 20,
          "change.1403": 100
        },
        totalSellCount: {
          "1402": 4000,
          "1403": 4000,
          "change.1403": 0
        },
        totalSellPrice: {
          "1402": 90819,
          "1403": 1067615,
          "change.1403": 1075.5414615884342
        }
      }
    ],
    month: 12,
    period: 1,
    total: 155,
    years: ["1402", "1403"]
  };

  getChangeYear(year: string): string {
    return `change.${year}`;
  }

  getValueWithCommas(value: number): string {
    return value.toLocaleString();
  }

  getPercentage(value: number): string {
    if(!value)
      return '0%';
    return `${value.toFixed(2)}%`;
  }
}
