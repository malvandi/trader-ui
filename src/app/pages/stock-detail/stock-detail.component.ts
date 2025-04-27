import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { registerables } from 'chart.js';

Chart.register(...registerables);

interface StockData {
  year: number;
  month: number;
  domestic: number;
  export: number;
}

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  template: `
    <div class="stock-detail-container">
      <h2>Stock Details</h2>
      <p>Stock ID: {{ stockId }}</p>
      
      <div class="chart-container">
        <canvas baseChart
          [data]="chartData"
          [options]="chartOptions"
          [type]="chartType">
        </canvas>
      </div>
    </div>
  `,
  styleUrls: ['./stock-detail.component.scss']
})
export class StockDetailComponent implements OnInit {
  stockId: number | null = null;
  chartType: ChartType = 'bar';
  chartData: ChartConfiguration['data'] = {
    datasets: []
  };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false
      }
    }
  };

  private readonly persianMonths = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند'
  ];

  private sampleData: StockData[] = [
    {
      "year": 1400,
      "month": 1,
      "domestic": 160464,
      "export": 0
    },
    {
      "year": 1400,
      "month": 2,
      "domestic": 213342,
      "export": 0
    },
    {
      "year": 1400,
      "month": 3,
      "domestic": 209141,
      "export": 0
    },
    {
      "year": 1400,
      "month": 4,
      "domestic": 211003,
      "export": 0
    },
    {
      "year": 1400,
      "month": 5,
      "domestic": 287808,
      "export": 0
    },
    {
      "year": 1400,
      "month": 6,
      "domestic": 251592,
      "export": 0
    },
    {
      "year": 1400,
      "month": 7,
      "domestic": 290293,
      "export": 0
    },
    {
      "year": 1400,
      "month": 8,
      "domestic": 281149,
      "export": 0
    },
    {
      "year": 1400,
      "month": 9,
      "domestic": 355728,
      "export": 0
    },
    {
      "year": 1400,
      "month": 10,
      "domestic": 379036,
      "export": 0
    },
    {
      "year": 1400,
      "month": 11,
      "domestic": 320727,
      "export": 0
    },
    {
      "year": 1400,
      "month": 12,
      "domestic": 292669,
      "export": 0
    },
    {
      "year": 1401,
      "month": 1,
      "domestic": 282585,
      "export": 0
    },
    {
      "year": 1401,
      "month": 2,
      "domestic": 365841,
      "export": 0
    },
    {
      "year": 1401,
      "month": 3,
      "domestic": 305385,
      "export": 0
    },
    {
      "year": 1401,
      "month": 4,
      "domestic": 213121,
      "export": 0
    },
    {
      "year": 1401,
      "month": 5,
      "domestic": 214849,
      "export": 0
    },
    {
      "year": 1401,
      "month": 6,
      "domestic": 181113,
      "export": 0
    },
    {
      "year": 1401,
      "month": 7,
      "domestic": 193360,
      "export": 0
    },
    {
      "year": 1401,
      "month": 8,
      "domestic": 344244,
      "export": 0
    },
    {
      "year": 1401,
      "month": 9,
      "domestic": 197549,
      "export": 0
    },
    {
      "year": 1401,
      "month": 10,
      "domestic": 59514,
      "export": 0
    },
    {
      "year": 1401,
      "month": 11,
      "domestic": 151181,
      "export": 0
    },
    {
      "year": 1402,
      "month": 1,
      "domestic": 312093,
      "export": 0
    },
    {
      "year": 1402,
      "month": 2,
      "domestic": 297733,
      "export": 0
    },
    {
      "year": 1402,
      "month": 3,
      "domestic": 434252,
      "export": 0
    },
    {
      "year": 1402,
      "month": 4,
      "domestic": 368792,
      "export": 0
    },
    {
      "year": 1402,
      "month": 5,
      "domestic": 270652,
      "export": 0
    },
    {
      "year": 1402,
      "month": 6,
      "domestic": 280018,
      "export": 0
    },
    {
      "year": 1402,
      "month": 7,
      "domestic": 537315,
      "export": 0
    },
    {
      "year": 1402,
      "month": 8,
      "domestic": 624419,
      "export": 0
    },
    {
      "year": 1402,
      "month": 9,
      "domestic": 597455,
      "export": 0
    },
    {
      "year": 1402,
      "month": 10,
      "domestic": 459566,
      "export": 0
    },
    {
      "year": 1402,
      "month": 12,
      "domestic": 345978,
      "export": 0
    },
    {
      "year": 1403,
      "month": 1,
      "domestic": 156534,
      "export": 0
    },
    {
      "year": 1403,
      "month": 2,
      "domestic": 384215,
      "export": 0
    },
    {
      "year": 1403,
      "month": 3,
      "domestic": 728003,
      "export": 0
    },
    {
      "year": 1403,
      "month": 4,
      "domestic": 345080,
      "export": 0
    },
    {
      "year": 1403,
      "month": 5,
      "domestic": 358034,
      "export": 0
    },
    {
      "year": 1403,
      "month": 6,
      "domestic": 276142,
      "export": 0
    },
    {
      "year": 1403,
      "month": 7,
      "domestic": 485397,
      "export": 0
    },
    {
      "year": 1403,
      "month": 8,
      "domestic": 549957,
      "export": 0
    },
    {
      "year": 1403,
      "month": 9,
      "domestic": 379608,
      "export": 0
    },
    {
      "year": 1403,
      "month": 10,
      "domestic": 671092,
      "export": 0
    },
    {
      "year": 1403,
      "month": 11,
      "domestic": 524001,
      "export": 0
    },
    {
      "year": 1403,
      "month": 12,
      "domestic": 693056,
      "export": 0
    }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.stockId = +params['id'];
      this.initializeChart();
    });
  }

  private initializeChart() {
    // Group data by year
    const groupedData = this.sampleData.reduce((acc, curr) => {
      if (!acc[curr.year]) {
        acc[curr.year] = [];
      }
      acc[curr.year].push(curr);
      return acc;
    }, {} as Record<number, StockData[]>);

    // Sort years
    const sortedYears = Object.keys(groupedData).sort((a, b) => Number(a) - Number(b));

    // Create datasets for each year
    const datasets = sortedYears.map(year => {
      const yearData = groupedData[Number(year)];
      const monthValues = new Array(12).fill(0);
      
      yearData.forEach(item => {
        monthValues[item.month - 1] = item.domestic;
      });

      return {
        label: `Year ${year}`,
        data: monthValues,
        backgroundColor: this.getRandomColor()
      };
    });

    this.chartData = {
      labels: this.persianMonths,
      datasets
    };
  }

  private getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}
