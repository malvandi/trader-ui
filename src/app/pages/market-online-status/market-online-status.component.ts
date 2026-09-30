import {Component, OnInit, ViewChild, ElementRef, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDialogModule, MatDialog} from '@angular/material/dialog';
import {
    MatAutocomplete,
    MatAutocompleteModule,
    MatAutocompleteSelectedEvent,
    MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import {MatChipGrid, MatChipInput, MatChipRow, MatChipsModule, MatChipInputEvent} from '@angular/material/chips';
import {MatOptionModule} from '@angular/material/core';
import {
    Observable,
    of,
    BehaviorSubject,
    debounceTime,
    distinctUntilChanged,
    switchMap,
    catchError,
    startWith,
    map,
    shareReplay,
    finalize
} from 'rxjs';
import {environment} from '../../../environments/environment';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MarketOnlineStatusProjectService, OnlineMarketProject} from './market-online-status-project.service';

const PRESETS_STORAGE_KEY = 'market-online-status-filter-presets';

interface ProjectFilters {
    groups?: string[];
    codes?: string[];
    humanPower?: number;
    humanMoneyInflow?: number;
    suspiciousTradingVolume?: number;
    isNegativeLast5Days?: boolean;
    isBuyQueue?: boolean;
    isSellQueue?: boolean;
    page?: number;
    limit?: number;
}

interface FilterPreset {
    name: string;
    filters: ProjectFilters;
}

function getDefaultPresets(): OnlineMarketProject[] {
    return [
        {
            name: 'Project 1',
            filters: {
                codes: null,
                groups: null,
                humanPower: 2,
                humanMoneyInflow: null,
                suspiciousTradingVolume: null,
                isBuyQueue: true,
                isSellQueue: false,
                isNegativeLast5Days: null,
                page: 0,
                limit: 20
            }
        },
        {
            name: 'Project 2',
            filters: {
                codes: null,
                groups: null,
                humanPower: null,
                humanMoneyInflow: 3,
                suspiciousTradingVolume: 5,
                isBuyQueue: null,
                isSellQueue: null,
                isNegativeLast5Days: null,
                page: 0,
                limit: 20
            }
        }
    ];
}

function loadPresetsFromStorage(): OnlineMarketProject[] {
    try {
        const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map(p => ({
                    name: p.name,
                    filters: {
                        groups: p.filters.groups?.length ? p.filters.groups : null,
                        codes: p.filters.codes?.length ? p.filters.codes : null,
                        humanPower: p.filters.humanPower ?? null,
                        humanMoneyInflow: p.filters.humanMoneyInflow ?? null,
                        suspiciousTradingVolume: p.filters.suspiciousTradingVolume ?? null,
                        isNegativeLast5Days: p.filters.isNegativeLast5Days ?? null,
                        isBuyQueue: p.filters.isBuyQueue ?? null,
                        isSellQueue: p.filters.isSellQueue ?? null,
                        page: p.filters.page ?? 0,
                        limit: p.filters.limit ?? 20
                    }
                }));
            }
        }
    } catch (e) {
        console.error('Error loading presets from localStorage:', e);
    }
    return getDefaultPresets().map(p => ({
        name: p.name,
        filters: {
            groups: null,
            codes: null,
            humanPower: p.filters.humanPower ?? null,
            humanMoneyInflow: p.filters.humanMoneyInflow ?? null,
            suspiciousTradingVolume: p.filters.suspiciousTradingVolume ?? null,
            isNegativeLast5Days: p.filters.isNegativeLast5Days ?? null,
            isBuyQueue: p.filters.isBuyQueue ?? null,
            isSellQueue: p.filters.isSellQueue ?? null,
            page: 0,
            limit: 20
        }
    }));
}

function savePresetsToStorage(presets: FilterPreset[]): void {
    try {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
        console.error('Error saving presets to localStorage:', e);
    }
}

interface StockGroup {
    name: string;
    translate: string;
}

interface Stock {
    code: string;
    name: string;
    tehranExchangeId: string;
    group: string;
    eps: number;
    pOnE: number;
    id: number;
}

interface ProjectFilters {
    groups?: string[];
    codes?: string[];
    humanPower?: number;
    humanMoneyInflow?: number;
    suspiciousTradingVolume?: number;
    isNegativeLast5Days?: boolean;
    isBuyQueue?: boolean;
    isSellQueue?: boolean;
    page?: number;
    limit?: number;
}

interface FilterPreset {
    name: string;
    filters: ProjectFilters;
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
    groups?: string[];
    codes?: string[];
    humanPower?: number;
    humanMoneyInflow?: number;
    suspiciousTradingVolume?: number;
    isNegativeLast5Days?: boolean;
    isBuyQueue?: boolean;
    isSellQueue?: boolean;
    page: number;
    limit: number;
}

@Component({
    selector: 'app-market-online-status',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
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
        MatAutocompleteTrigger,
        MatChipInput,
        MatAutocomplete,
        MatChipRow,
        MatChipGrid
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
    selectedCodes: string[] = [];
    humanPower: number | null = null;
    humanMoneyInflow: number | null = null;
    suspiciousTradingVolume: number | null = null;
    isNegativeLast5Days: boolean | null = null;
    isBuyQueue: boolean | null = null;
    isSellQueue: boolean | null = null;

    // Stock search
    stocks: Stock[] = [];
    filteredStocks: Observable<Stock[]> = of([]);
    stockSearchControl = new BehaviorSubject<string>('');
    isLoadingStocks = false;
    stockSearchError: string | null = null;
    private stockSearchCache = new Map<string, Stock[]>();

    @ViewChild('stockSearchInput') stockSearchInput!: ElementRef<HTMLInputElement>;

    // Boolean filter options
    booleanOptions = [
        {value: null, label: 'بدون فیلتر'},
        {value: true, label: 'بله'},
        {value: false, label: 'خیر'}
    ];

    // Filter panel state
    filtersExpanded = false;

    // Tooltip texts
    hints = {
        humanPowerTooltip: 'سرانه خرید/فروش حقیقی: تعداد سهم خرید/فروش تقسیم بر تعداد خریدار/فروشنده.' + '\n' +
            'در صورتی که خریداران قویتری داشته باشد، تقسیم سرانه خرید به سرانه فروش' + '\n' +
            'در صورتی که فروشندگان قویتری داشته باشه، منفی تقسیم سرانه فروش به سرانه خرید',
        humanMoneyInflow: 'در صورتی که خریداران قویتری داشته باشد، از تقسیم حجم خرید خالص حقیقی تقسیم بر میانگین حجم ماهانه' + '\n' +
            'این رقم هرچه بالاتر باشد، ینی ورود پول حقیقی با شدت بیشتری در حال انجام است',
        suspiciousTradingVolume: 'از تقسیم حجم معامله شده به میانگین ماهانه بدست می آید' + '\n' +
            'توجه داشته باشید که این مقدار در صورتی قابل توجه است که ورود پول حقیقی داشته باشیم و به تنهایی نمی تواند معیار قرار گیرد',
        negativeLast5Days: 'آیا در 5 روز اخیر در محدوده منفی معامله شده است؟'
    };

    // Filter Projects (from backend)
    projectFilters: OnlineMarketProject[] = [];
    isLoadingProjects = false;
    projectsError: string | null = null;

    selectedPreset: string | null = null;

    private projectService = inject(MarketOnlineStatusProjectService);

    constructor(private http: HttpClient, private dialog: MatDialog) {
        this.initStockSearch();
    }

    toggleFilters(): void {
        this.filtersExpanded = !this.filtersExpanded;
    }

    ngOnInit(): void {
        this.loadGroups();
        this.loadProjects();
        this.loadMarketData();
    }

    private loadProjects(): void {
        this.isLoadingProjects = true;
        this.projectsError = null;

        this.projectService.getProjects().subscribe({
            next: (projects) => {
                this.projectFilters = projects;
                this.isLoadingProjects = false;

                // If there was a previously selected preset, try to restore it
                // (This handles the case where user had a localStorage preset selected)
                const savedPreset = localStorage.getItem('market-online-status-selected-preset');
                if (savedPreset && this.projectFilters.some(p => p.name === savedPreset)) {
                    this.applyPreset(savedPreset);
                }
            },
            error: (error) => {
                console.error('Error loading projects:', error);
                // Log more details for debugging
                if (error.status === 0) {
                    console.error('Network error - check if backend is running on port 9031 and CORS is configured');
                } else if (error.status === 404) {
                    console.error('API endpoint not found - check the URL');
                }
                this.projectsError = 'خطا در بارگذاری پروژه‌ها از سرور';
                this.isLoadingProjects = false;

                // Fallback to localStorage for backward compatibility
                this.projectFilters = loadPresetsFromStorage();
            }
        });
    }

    private initStockSearch(): void {
        this.filteredStocks = this.stockSearchControl.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap((searchTerm: string) => this.searchStocks(searchTerm)),
            catchError(() => of([])),
            shareReplay(1)
        );
    }

    searchStocks(searchTerm: string): Observable<Stock[]> {
        const trimmedTerm = searchTerm.trim();

        // Check cache first
        if (this.stockSearchCache.has(trimmedTerm)) {
            return of(this.stockSearchCache.get(trimmedTerm)!);
        }

        this.isLoadingStocks = true;
        this.stockSearchError = null;

        const params: Record<string, string> = {};
        if (trimmedTerm) {
            params['search'] = trimmedTerm;
        }

        return this.http.get<Stock[]>(`${environment.ktapi}/stocks`, {params}).pipe(
            map((stocks) => {
                // Deduplicate by code
                const seen = new Set<string>();
                const uniqueStocks = stocks.filter(stock => {
                    if (seen.has(stock.code)) {
                        return false;
                    }
                    seen.add(stock.code);
                    return true;
                });

                // Cache the results
                this.stockSearchCache.set(trimmedTerm, uniqueStocks);
                this.isLoadingStocks = false;
                return uniqueStocks;
            }),
            catchError((error) => {
                console.error('Error loading stocks:', error);
                this.isLoadingStocks = false;
                this.stockSearchError = 'خطا در بارگذاری نمادها';
                return of([]);
            })
        );
    }

    onStockSearch(event: Event | MatChipInputEvent): void {
        if ('value' in event) {
            // MatChipInputEvent
            const chipEvent = event as MatChipInputEvent;
            this.stockSearchControl.next(chipEvent.value);
        } else {
            // Regular Event
            const input = event.target as HTMLInputElement;
            this.stockSearchControl.next(input.value);
        }
    }

    onStockSelected(event: MatAutocompleteSelectedEvent | Event): void {
        const autoEvent = event as MatAutocompleteSelectedEvent;
        const stock = autoEvent.option?.value as Stock;
        if (stock && !this.selectedCodes.includes(stock.code)) {
            this.selectedCodes.push(stock.code);
        }
        // Clear the input
        autoEvent.option?.deselect();
        if (this.stockSearchInput) {
            this.stockSearchInput.nativeElement.value = '';
        }
        this.stockSearchControl.next('');
        this.onFilterChange();
    }

    removeCode(code: string): void {
        this.selectedCodes = this.selectedCodes.filter(c => c !== code);
        this.onFilterChange();
    }

    getSelectedCodesDisplay(): string {
        if (this.selectedCodes.length === 0) {
            return 'همه نمادها';
        }
        if (this.selectedCodes.length <= 3) {
            return this.selectedCodes.join(', ');
        }
        return `${this.selectedCodes.length} نماد انتخاب شده`;
    }

    applyPreset(presetName: string): void {
        const preset = this.projectFilters.find(p => p.name === presetName);
        if (!preset) return;

        const filters = preset.filters;

        // Reset all filters first
        this.clearFiltersWithoutReload();

        // Apply preset values - handle both old localStorage format and new API format
        if (filters.groups !== undefined) {
            this.selectedGroups = filters.groups || [];
        }
        if (filters.codes !== undefined) {
            this.selectedCodes = filters.codes || [];
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
        // Save selected preset to localStorage for persistence across sessions
        localStorage.setItem('market-online-status-selected-preset', presetName);
        this.onFilterChange();
    }

    clearFiltersWithoutReload(): void {
        this.selectedGroups = [];
        this.selectedCodes = [];
        this.humanPower = null;
        this.humanMoneyInflow = null;
        this.suspiciousTradingVolume = null;
        this.isNegativeLast5Days = null;
        this.isBuyQueue = null;
        this.isSellQueue = null;
        this.selectedPreset = null;
    }

    saveCurrentFiltersAsPreset(): void {
        const name = prompt('نام پروژه جدید را وارد کنید:');
        if (!name || !name.trim()) return;

        const trimmedName = name.trim();

        // Check if project with this name already exists
        const existingIndex = this.projectFilters.findIndex(p => p.name === trimmedName);

        const currentFilters = this.buildProjectFilters();

        const request = {
            name: trimmedName,
            filters: currentFilters
        };

        this.projectService.createProject(request).subscribe({
            next: (createdProject) => {
                if (existingIndex >= 0) {
                    this.projectFilters[existingIndex] = createdProject;
                } else {
                    this.projectFilters.push(createdProject);
                }
                this.selectedPreset = trimmedName;
                localStorage.setItem('market-online-status-selected-preset', trimmedName);
            },
            error: (error) => {
                console.error('Error saving project:', error);
                alert('خطا در ذخیره پروژه. لطفاً دوباره تلاش کنید.');
            }
        });
    }

    private buildProjectFilters() {
        return {
            codes: this.selectedCodes.length > 0 ? [...this.selectedCodes] : null,
            groups: this.selectedGroups.length > 0 ? [...this.selectedGroups] : null,
            humanPower: this.humanPower ?? null,
            humanMoneyInflow: this.humanMoneyInflow ?? null,
            suspiciousTradingVolume: this.suspiciousTradingVolume ?? null,
            isBuyQueue: this.isBuyQueue ?? null,
            isSellQueue: this.isSellQueue ?? null,
            isNegativeLast5Days: this.isNegativeLast5Days ?? null,
            page: 0,
            limit: this.pageSize
        };
    }

    onPresetSelectionChange(presetName: string): void {
        if (presetName) {
            this.applyPreset(presetName);
        } else {
            this.selectedPreset = null;
            localStorage.removeItem('market-online-status-selected-preset');
        }
    }

    deletePreset(presetName: string): void {
        // Note: Backend doesn't have DELETE endpoint yet, so we only remove from local list
        // In a full implementation, you would call a DELETE API here
        this.projectFilters = this.projectFilters.filter(p => p.name !== presetName);
        if (this.selectedPreset === presetName) {
            this.selectedPreset = null;
            localStorage.removeItem('market-online-status-selected-preset');
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
            filter.groups = this.selectedGroups;
        }
        if (this.selectedCodes.length > 0) {
            filter.codes = this.selectedCodes;
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

    trackByCode(index: number, code: string): string {
        return code;
    }
}
