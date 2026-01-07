import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {CanvasJSAngularChartsModule} from '@canvasjs/angular-charts';
import {FormsModule} from '@angular/forms';
import {PERSIAN_MONTHS} from '../../models/persian-month.model';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Util} from '../../util/Util';

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
        {value: 'domestic', label: 'فروش داخلی'},
        {value: 'export', label: 'فروش صادراتی'},
        {value: 'total', label: 'مجموع فروش'}
    ];
    viewTypes = [
        {value: 'simple', label: 'نمایش ماهانه'},
        {value: 'sum', label: 'نمایش تجمعی'}
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
    ) {
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.code = params['id'];
            this.fetchStockData();
        });
    }

    private fetchStockData() {
        if (!this.code) return;
        this.isLoading = true;

        this.http.post<StockData[]>(`${environment.ktapi}/activity-report/history`, {code: this.code})
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

                const trillionValue = Util.convertToTrillionToman(value);

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
                    return Util.formatDisplayValue(e.value * 10000);
                }
            },
            toolTip: {
                shared: true,
                fontFamily: DEFAULT_FONT_FAMILY,
                contentFormatter: (e: any) => {
                    let content = "";
                    sortedYears.forEach((year: string) => {
                        const yearEntry = e.entries.filter((entry: any) => entry.dataSeries.name === year)[0];

                        if (yearEntry == null) {
                            content += year + '<span style="color: red">' + ': داده موجود نیست' + '</span><br/>';
                        } else {
                            content += yearEntry.dataSeries.name + ": " + Util.formatDisplayValue(yearEntry.dataPoint.y * 10000) + " میلیارد تومان<br/>";
                        }
                    });
                    return '<div style="direction: rtl; text-align: right">' + content + '</div>';
                }
            },
            legend: {
                cursor: "pointer",
                fontFamily: DEFAULT_FONT_FAMILY,
                itemclick: function (e: any) {
                    if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
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

    private getBars() {
        return [{"time":1681216198000,"utc":"2023-04-11T12:29:58Z","open":7760,"high":8050,"low":7750,"close":8000,"volume":10845621},{"time":1681561653000,"utc":"2023-04-15T12:27:33Z","open":8130,"high":8130,"low":8130,"close":8130,"volume":5768862},{"time":1681648071000,"utc":"2023-04-16T12:27:51Z","open":8370,"high":8370,"low":8370,"close":8370,"volume":4190396},{"time":1681734493000,"utc":"2023-04-17T12:28:13Z","open":8620,"high":8620,"low":8400,"close":8620,"volume":9614102},{"time":1681820979000,"utc":"2023-04-18T12:29:39Z","open":8840,"high":8840,"low":8600,"close":8840,"volume":15886017},{"time":1681907396000,"utc":"2023-04-19T12:29:56Z","open":8850,"high":9050,"low":8810,"close":9050,"volume":8731956},{"time":1682339140000,"utc":"2023-04-24T12:25:40Z","open":9280,"high":9280,"low":9130,"close":9280,"volume":6381271},{"time":1682425786000,"utc":"2023-04-25T12:29:46Z","open":9550,"high":9550,"low":9170,"close":9330,"volume":11345099},{"time":1682512192000,"utc":"2023-04-26T12:29:52Z","open":9390,"high":9390,"low":9200,"close":9200,"volume":15278381},{"time":1682771396000,"utc":"2023-04-29T12:29:56Z","open":9300,"high":9480,"low":9020,"close":9370,"volume":11777413},{"time":1682857787000,"utc":"2023-04-30T12:29:47Z","open":9590,"high":9590,"low":9160,"close":9340,"volume":12401727},{"time":1682944168000,"utc":"2023-05-01T12:29:28Z","open":9480,"high":9480,"low":9040,"close":9220,"volume":8423774},{"time":1683030580000,"utc":"2023-05-02T12:29:40Z","open":9140,"high":9540,"low":9140,"close":9540,"volume":10181558},{"time":1683116979000,"utc":"2023-05-03T12:29:39Z","open":9650,"high":9770,"low":9530,"close":9770,"volume":9992589},{"time":1683376091000,"utc":"2023-05-06T12:28:11Z","open":10030,"high":10030,"low":9890,"close":10030,"volume":12190536},{"time":1683453615000,"utc":"2023-05-07T10:00:15Z","open":10320,"high":10320,"low":9720,"close":9720,"volume":5352654},{"time":1683635385000,"utc":"2023-05-09T12:29:45Z","open":9740,"high":9740,"low":9740,"close":9740,"volume":690806},{"time":1683720767000,"utc":"2023-05-10T12:12:47Z","open":9450,"high":9450,"low":9450,"close":9450,"volume":689125},{"time":1683975707000,"utc":"2023-05-13T11:01:47Z","open":9170,"high":9170,"low":9170,"close":9170,"volume":688434},{"time":1684326456000,"utc":"2023-05-17T12:27:36Z","open":8900,"high":8900,"low":8900,"close":8900,"volume":2519410}];
    }
}
