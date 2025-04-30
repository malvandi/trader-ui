import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CanvasJSAngularChartsModule } from '@canvasjs/angular-charts';
import { FormsModule } from '@angular/forms';
import { PERSIAN_MONTHS } from '../../models/persian-month.model';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface StockData {
  year: number;
  month: number;
  domestic: number;
  export: number;
}

type DataType = 'domestic' | 'export' | 'total';
type ViewType = 'simple' | 'sum';

const DEFAULT_FONT_FAMILY = "'iransansv', 'iransans', sans-serif";

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [
    CommonModule, 
    CanvasJSAngularChartsModule, 
    FormsModule, 
    HttpClientModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './stock-detail.component.html',
  styleUrls: ['./stock-detail.component.scss']
})
export class StockDetailComponent implements OnInit {
  code: string | null = null;
  chartOptions: any = null;
  selectedView: ViewType = 'simple';
  selectedDataType: DataType = 'total';
  dataTypes = [
    { value: 'domestic', label: 'فروش داخلی' },
    { value: 'export', label: 'فروش صادراتی' },
    { value: 'total', label: 'مجموع فروش' }
  ];
  viewTypes = [
    { value: 'simple', label: 'نمایش ماهانه' },
    { value: 'sum', label: 'نمایش تجمعی' }
  ];
  private chart: any;
  private stockData: StockData[] = [];
  isLoading = true;
  showChart = true;

  private readonly persianMonths = PERSIAN_MONTHS;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.code = params['id'];
      this.fetchStockData();
    });
  }

  private fetchStockData() {
    if (!this.code) return;
    this.isLoading = true;

    this.http.post<StockData[]>(`${environment.ktapi}/activity-report/history`, { code: this.code })
      .subscribe({
        next: (data) => {
          this.stockData = data.map(item => ({
            year: Number(item.year),
            month: Number(item.month),
            domestic: Number(item.domestic),
            export: Number(item.export)
          }));
          this.prepareChartData();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onViewChange() {
    this.updateChart();
  }

  onDataTypeChange() {
    this.recreateChart();
  }

  private recreateChart() {
    this.showChart = false;
    this.cdr.detectChanges();

    this.prepareChartData();

    setTimeout(() => {
      this.showChart = true;
      this.cdr.detectChanges();
    }, 100);
  }

  private updateChart() {
    this.prepareChartData();
    if (this.chart) {
      this.chart.render();
    }
  }

  chartInstance(chart: any) {
    this.chart = chart;
  }

  private convertToTrillionToman(value: number): number {
    return value / 10000;
  }

  private formatDisplayValue(value: number): string {
    const trillionValue = this.convertToTrillionToman(value);
    let formattedNumber: number;

    if (trillionValue < 10) {
      formattedNumber = Number(trillionValue.toFixed(2));
    } else if (trillionValue < 100) {
      formattedNumber = Number(trillionValue.toFixed(1));
    } else {
      formattedNumber = Number(trillionValue.toFixed(0));
    }

    if (formattedNumber >= 1000) {
      return formattedNumber.toLocaleString();
    }
    return formattedNumber.toString();
  }

  private getValueForDataType(data: StockData): number {
    switch (this.selectedDataType) {
      case 'domestic':
        return data.domestic;
      case 'export':
        return data.export;
      case 'total':
        return data.domestic + data.export;
      default:
        return 0;
    }
  }

  private prepareChartData() {
    if (!this.stockData.length) return;

    const groupedData = this.stockData.reduce((acc, curr) => {
      if (!acc[curr.year]) {
        acc[curr.year] = [];
      }
      acc[curr.year].push(curr);
      return acc;
    }, {} as Record<number, StockData[]>);

    const sortedYears = Object.keys(groupedData).sort((a, b) => Number(a) - Number(b));

    const dataSeries = sortedYears.map(year => {
      const yearData = groupedData[Number(year)];
      const dataPoints = this.persianMonths.map((month, index) => {
        const monthData = yearData.find(item => item.month === index + 1);
        
        if (!monthData) {
          return {
            label: month.label,
            y: null
          };
        }

        let value = this.getValueForDataType(monthData);

        if (this.selectedView === 'sum') {
          const monthsUpToCurrent = yearData.filter(item => item.month <= index + 1);
          if (monthsUpToCurrent.length === 0) {
            return {
              label: month.label,
              y: null
            };
          }
          value = monthsUpToCurrent.reduce((sum, item) => sum + this.getValueForDataType(item), 0);
        }

        const trillionValue = this.convertToTrillionToman(value);

        return {
          label: month.label,
          y: trillionValue
        };
      });

      return {
        type: "column",
        name: year,
        showInLegend: true,
        dataPoints: dataPoints
      };
    });

    const dataTypeLabels = {
      'domestic': 'فروش داخلی',
      'export': 'فروش صادراتی',
      'total': 'مجموع فروش'
    };

    this.chartOptions = {
      animationEnabled: true,
      exportEnabled: true,
      fontFamily: DEFAULT_FONT_FAMILY,
      title: {
        text: this.selectedView === 'simple' 
          ? `${dataTypeLabels[this.selectedDataType]} به تفکیک ماه` 
          : `${dataTypeLabels[this.selectedDataType]} تجمعی`,
        fontFamily: DEFAULT_FONT_FAMILY
      },
      axisX: {
        title: "ماه",
        titleFontFamily: DEFAULT_FONT_FAMILY,
        labelFontFamily: DEFAULT_FONT_FAMILY
      },
      axisY: {
        title: this.selectedView === 'simple' 
          ? `${dataTypeLabels[this.selectedDataType]} (میلیارد تومان)` 
          : `${dataTypeLabels[this.selectedDataType]} تجمعی (میلیارد تومان)`,
        titleFontFamily: DEFAULT_FONT_FAMILY,
        labelFontFamily: DEFAULT_FONT_FAMILY,
        labelFormatter: (e: any) => {
          return this.formatDisplayValue(e.value * 10000);
        }
      },
      toolTip: {
        shared: true,
        fontFamily: DEFAULT_FONT_FAMILY,
        contentFormatter: (e: any) => {
          let content = "";
          e.entries.forEach((entry: any) => {
            if (entry.dataPoint.y === null) {
              content += entry.dataSeries.name + ": داده موجود نیست<br/>";
            } else {
              content += entry.dataSeries.name + ": " + this.formatDisplayValue(entry.dataPoint.y * 10000) + " میلیارد تومان<br/>";
            }
          });
          return content;
        }
      },
      legend: {
        cursor: "pointer",
        fontFamily: DEFAULT_FONT_FAMILY,
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
}
