import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CanvasJSAngularChartsModule } from '@canvasjs/angular-charts';
import { FormsModule } from '@angular/forms';
import { PERSIAN_MONTHS } from '../../models/persian-month.model';

interface StockData {
  year: number;
  month: number;
  domestic: number;
  export: number;
}

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [CommonModule, CanvasJSAngularChartsModule, FormsModule],
  templateUrl: './stock-detail.component.html',
  styleUrls: ['./stock-detail.component.scss']
})
export class StockDetailComponent implements OnInit {
  stockId: number | null = null;
  chartOptions: any;
  selectedView: 'simple' | 'sum' = 'simple';
  private chart: any;

  private readonly persianMonths = PERSIAN_MONTHS;
  private sampleData: StockData[] = this.getSampleData();

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.stockId = +params['id'];
      this.initializeChart();
    });
  }

  onViewChange() {
    // Force chart update by creating new options object
    this.chartOptions = null;
    setTimeout(() => {
      this.initializeChart();
    }, 0);
  }

  chartInstance(chart: any) {
    this.chart = chart;
  }

  private formatValue(value: number): number {
    // Convert from billion rials to trillion toman
    const valueInTrillionToman = value / 10000;

    if (valueInTrillionToman < 10) {
      return Number(valueInTrillionToman.toFixed(2));
    } else if (valueInTrillionToman < 100) {
      return Number(valueInTrillionToman.toFixed(1));
    } else {
      return Number(valueInTrillionToman.toFixed(0));
    }
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

    // Create data series for each year
    const dataSeries = sortedYears.map(year => {
      const yearData = groupedData[Number(year)];
      const dataPoints = this.persianMonths.map((month, index) => {
        const monthData = yearData.find(item => item.month === index + 1);
        let value = monthData ? monthData.domestic : 0;

        if (this.selectedView === 'sum') {
          // Calculate sum up to current month
          value = yearData
            .filter(item => item.month <= index + 1)
            .reduce((sum, item) => sum + item.domestic, 0);
        }

        return {
          label: month.label,
          y: this.formatValue(value)
        };
      });

      return {
        type: "column",
        name: year,
        showInLegend: true,
        dataPoints: dataPoints
      };
    });

    this.chartOptions = {
      animationEnabled: true,
      exportEnabled: true,
      fontFamily: "'iransansv', 'iransans', sans-serif",
      title: {
        text: this.selectedView === 'simple' ? "Stock Activity by Month" : "Cumulative Stock Activity",
        fontFamily: "'iransansv', 'iransans', sans-serif"
      },
      axisX: {
        title: "Month",
        titleFontFamily: "'iransansv', 'iransans', sans-serif",
        labelFontFamily: "'iransansv', 'iransans', sans-serif"
      },
      axisY: {
        title: this.selectedView === 'simple' ? "Domestic Sales (میلیارد تومان)" : "Cumulative Domestic Sales (میلیارد تومان)",
        titleFontFamily: "'iransansv', 'iransans', sans-serif",
        labelFontFamily: "'iransansv', 'iransans', sans-serif"
      },
      toolTip: {
        shared: true,
        fontFamily: "'iransansv', 'iransans', sans-serif",
        contentFormatter: (e: any) => {
          let content = "";
          e.entries.forEach((entry: any) => {
            content += entry.dataSeries.name + ": " + entry.dataPoint.y + " میلیارد تومان<br/>";
          });
          return content;
        }
      },
      legend: {
        cursor: "pointer",
        fontFamily: "'iransansv', 'iransans', sans-serif",
        itemclick: function(e: any) {
          if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
            e.dataSeries.visible = false;
          } else {
            e.dataSeries.visible = true;
          }
          e.chart.render();
        }
      },
      data: dataSeries
    };
  }

  private getSampleData(): StockData[] {
    return [
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
    ]
  }
}
