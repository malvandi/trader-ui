import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {environment} from '../../../environments/environment';

interface CodalDataItem {
    code: string;
    title: string;
    url: string;
    name: string;
    status?: 'init' | 'in_process' | 'success' | 'failure';
}

interface UrlEntry {
    url: string;
    status: 'init' | 'success' | 'failure' | 'in_process';
    pageNumber: number;
}

const STORAGE_KEY = 'fetchCodalData';
const DEFAULT_URL = 'https://search.codal.ir/api/search/v2/q?&Audited=true&AuditorRef=-1&Category=-1&Childs=true&CompanyState=-1&CompanyType=-1&Consolidatable=true&IsNotAudited=false&Length=-1&LetterType=58&Mains=true&NotAudited=true&NotConsolidatable=true&Publisher=false&ReportingType=-1&TracingNo=-1&search=true';
const DEFAULT_FROM_PAGE = 1;
const DEFAULT_TO_PAGE = 100;
const DEFAULT_THREADS = 3;

@Component({
    selector: 'app-fetch-codal-data',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        HttpClientModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressBarModule
    ],
    templateUrl: './fetch-codal-data.component.html',
    styleUrls: ['./fetch-codal-data.component.scss']
})
export class FetchCodalDataComponent implements OnInit {
    url: string = '';
    fromPage: number = 1;
    toPage: number = 1;
    threads: number = DEFAULT_THREADS;
    urlEntries: UrlEntry[] = [];
    dataList: CodalDataItem[] = [];
    isProcessing: boolean = false;
    isProcessingDataList: boolean = false;
    private activeCodalRequests: number = 0;
    isPaused: boolean = false;

    get totalCodalItems(): number {
        return this.dataList.length;
    }

    get successCount(): number {
        return this.dataList.filter(d => d.status === 'success').length;
    }

    get errorCount(): number {
        return this.dataList.filter(d => d.status === 'failure').length;
    }

    get inQueueCount(): number {
        return this.dataList.filter(d => !d.status || d.status === 'init' || d.status === 'in_process').length;
    }

    get progressPercent(): number {
        if (!this.totalCodalItems) {
            return 0;
        }
        const done = this.successCount + this.errorCount;
        return Math.round((done / this.totalCodalItems) * 100);
    }

    constructor(private http: HttpClient) {
    }

    ngOnInit(): void {
        this.loadFromLocalStorage();
    }

    loadFromLocalStorage(): void {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.url = data.url || DEFAULT_URL;
                this.fromPage = data.fromPage || DEFAULT_FROM_PAGE;
                this.toPage = data.toPage || DEFAULT_TO_PAGE;
                this.threads = data.threads || DEFAULT_THREADS;
            } catch (e) {
                console.error('Error parsing localStorage data:', e);
                this.setDefaultValues();
            }
        } else {
            this.setDefaultValues();
        }
    }

    setDefaultValues(): void {
        this.url = DEFAULT_URL;
        this.fromPage = DEFAULT_FROM_PAGE;
        this.toPage = DEFAULT_TO_PAGE;
        this.threads = DEFAULT_THREADS;
        this.saveToLocalStorage();
    }

    saveToLocalStorage(): void {
        const data = {
            url: this.url,
            fromPage: this.fromPage,
            toPage: this.toPage,
            threads: this.threads
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    onUrlChange(): void {
        this.saveToLocalStorage();
    }

    onFromPageChange(): void {
        this.saveToLocalStorage();
    }

    onToPageChange(): void {
        this.saveToLocalStorage();
    }

    onThreadsChange(): void {
        // ensure at least 1 thread
        if (!this.threads || this.threads < 1) {
            this.threads = 1;
        }
        this.saveToLocalStorage();

        // If processing is already running and not paused, try to fill up to new concurrency
        if (this.isProcessingDataList && !this.isPaused) {
            this.startCodalProcessing();
        }
    }

    generateUrls(): void {
        // If already started, use this button as a global pause / resume toggle
        if ((this.urlEntries.length > 0 || this.dataList.length > 0) &&
            (this.isProcessing || this.isProcessingDataList || this.activeCodalRequests > 0)) {
            this.isPaused = !this.isPaused;

            // When resuming, restart workers and announcement fetching if not finished
            if (!this.isPaused) {
                if (this.urlEntries.some(e => e.status === 'in_process')) {
                    this.fetchAllSequentially();
                }
                if (this.dataList.some(i => i.status === 'init')) {
                    this.startCodalProcessing();
                }
            }
            return;
        }

        if (!this.url || !this.fromPage || !this.toPage) {
            alert('Please fill in all fields');
            return;
        }

        if (this.fromPage > this.toPage) {
            alert('From page must be less than or equal to To page');
            return;
        }

        this.urlEntries = [];
        this.dataList = [];
        this.isProcessing = false;
        this.isPaused = false;

        for (let page = this.fromPage; page <= this.toPage; page++) {

            const url = new URL(this.url);
            url.searchParams.set('PageNumber', page.toString());
            const generatedUrl = url.toString();

            this.urlEntries.push({
                url: generatedUrl,
                status: 'init',
                pageNumber: page
            });
        }

        // Automatically start fetching announcements (URLs)
        this.fetchAllSequentially();
    }

    fetchAllSequentially(): void {
        if (this.urlEntries.length === 0) {
            return;
        }

        this.isProcessing = true;
        let currentIndex = 0;

        const fetchNext = () => {
            if (currentIndex >= this.urlEntries.length) {
                this.isProcessing = false;
                return;
            }

            const urlEntry = this.urlEntries[currentIndex];
            urlEntry.status = 'in_process';

            this.http.post<CodalDataItem[]>(
                `${environment.napi}/codal/codal-fetch-activity-reports-list`,
                {url: urlEntry.url}
            ).subscribe({
                next: (response) => {
                    urlEntry.status = 'success';
                    // Push all items from response to dataList and start Codal processing
                    if (Array.isArray(response)) {
                        const itemsWithStatus = response.map(item => ({
                            ...item,
                            status: 'init' as const
                        }));
                        this.dataList.push(...itemsWithStatus);
                        if (!this.isPaused) {
                            this.startCodalProcessing();
                        }
                    }
                    currentIndex++;
                    if (!this.isPaused) {
                        fetchNext();
                    }
                },
                error: (error) => {
                    console.error(`Error fetching URL ${urlEntry.url}:`, error);
                    urlEntry.status = 'failure';
                    currentIndex++;
                    if (!this.isPaused) {
                        fetchNext();
                    }
                }
            });
        };

        fetchNext();
    }

    fetchUrlData(urlEntry: UrlEntry): void {
        // Allow manual retry when finished or failed, but not if currently in flight
        if (urlEntry.status === 'in_process') {
            return;
        }

        urlEntry.status = 'in_process';

        this.http.post<CodalDataItem[]>(
            `${environment.napi}/codal/codal-fetch-activity-reports-list`,
            {url: urlEntry.url}
        ).subscribe({
            next: (response) => {
                urlEntry.status = 'success';
                // Push all items from response to dataList and start Codal processing
                if (Array.isArray(response)) {
                    const itemsWithStatus = response.map(item => ({
                        ...item,
                        status: 'init' as const
                    }));
                    this.dataList.push(...itemsWithStatus);
                    if (!this.isPaused) {
                        this.startCodalProcessing();
                    }
                }
            },
            error: (error) => {
                console.error(`Error fetching URL ${urlEntry.url}:`, error);
                urlEntry.status = 'failure';
            }
        });
    }

    retryCodalItem(item: CodalDataItem): void {
        if (!item.url) {
            return;
        }
        if (item.status === 'in_process') {
            return;
        }
        // Force re-download for this single item, regardless of global pause / pool
        this.processSingleCodalItem(item, true);
    }

    processDataListSequentially(): void {
        // Public entry to (re)start Codal data processing
        this.isPaused = false;
        this.startCodalProcessing();
    }

    private startCodalProcessing(): void {
        if (this.dataList.length === 0 || this.isPaused) {
            return;
        }

        this.isProcessingDataList = true;
        this.fillCodalWorkers();
    }

    private fillCodalWorkers(): void {
        // If globally paused, don't start new workers. Let in-flight requests finish.
        if (this.isPaused) {
            if (this.activeCodalRequests === 0) {
                this.isProcessingDataList = false;
            }
            return;
        }

        const maxThreads = Math.max(1, Math.floor(this.threads || 1));

        while (this.activeCodalRequests < maxThreads) {
            const nextItem = this.dataList.find(item => item.status === 'init');
            if (!nextItem) {
                break;
            }
            this.processSingleCodalItem(nextItem);
        }

        // If nothing is in flight and no pending items, stop processing flag
        if (this.activeCodalRequests === 0 && !this.dataList.some(item => item.status === 'init')) {
            this.isProcessingDataList = false;
        }
    }

    private processSingleCodalItem(item: CodalDataItem, force: boolean = false): void {
        // For automatic workers, respect global pause
        if (this.isPaused && !force) {
            return;
        }

        this.activeCodalRequests++;
        item.status = 'in_process';

        // First, fetch activity reports from napi
        this.http.post<any>(
            `${environment.napi}/codal/codal-fetch-activity-reports`,
            {url: item.url}
        ).subscribe({
            next: (response) => {
                // Then forward the response to ktapi
                this.http.post(
                    `${environment.ktapi}/activity-report`,
                    Array.isArray(response) ? response : [response]
                ).subscribe({
                    next: () => {
                        item.status = 'success';
                    },
                    error: (ktapiErr) => {
                        console.error(`Error forwarding to ktapi for item ${item.url}:`, ktapiErr);
                        item.status = 'failure';
                    },
                    complete: () => {
                        this.activeCodalRequests--;
                        this.fillCodalWorkers();
                    }
                });
            },
            error: (err) => {
                console.error(`Error fetching activity reports for item ${item.url}:`, err);
                item.status = 'failure';
                this.activeCodalRequests--;
                this.fillCodalWorkers();
            }
        });
    }

    openUrl(url: string): void {
        if (url) {
            window.open(url, '_blank');
        }
    }
}
