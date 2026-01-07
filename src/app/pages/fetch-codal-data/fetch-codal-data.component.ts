import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../environments/environment';

interface CodalDataItem {
  code: string;
  title: string;
  url: string;
  name: string;
}

interface UrlEntry {
  url: string;
  status: 'init' | 'success' | 'failure' | 'in_process';
  pageNumber: number;
}

const STORAGE_KEY = 'fetchCodalData';
const DEFAULT_URL = 'https://search.codal.ir/api/search/v2/q?&Audited=true&AuditorRef=-1&Category=3&Childs=true&CompanyState=-1&CompanyType=-1&Consolidatable=true&IsNotAudited=false&Length=-1&LetterType=-1&Mains=true&NotAudited=true&NotConsolidatable=true&PageNumber=1&Publisher=false&ReportingType=-1&TracingNo=-1&search=true';
const DEFAULT_FROM_PAGE = 1;
const DEFAULT_TO_PAGE = 100;

@Component({
  selector: 'app-fetch-codal-data',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './fetch-codal-data.component.html',
  styleUrls: ['./fetch-codal-data.component.scss']
})
export class FetchCodalDataComponent implements OnInit {
  url: string = '';
  fromPage: number = 1;
  toPage: number = 1;
  urlEntries: UrlEntry[] = [];
  dataList: CodalDataItem[] = [];
  isProcessing: boolean = false;

  constructor(private http: HttpClient) {}

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
    this.saveToLocalStorage();
  }

  saveToLocalStorage(): void {
    const data = {
      url: this.url,
      fromPage: this.fromPage,
      toPage: this.toPage
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

  generateUrls(): void {
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

    for (let page = this.fromPage; page <= this.toPage; page++) {
      const generatedUrl = this.url.includes('?') 
        ? `${this.url}&PageNumber=${page}` 
        : `${this.url}?PageNumber=${page}`;

      this.urlEntries.push({
        url: generatedUrl,
        status: 'init',
        pageNumber: page
      });
    }

    // Automatically start fetching sequentially
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
        { url: urlEntry.url }
      ).subscribe({
        next: (response) => {
          urlEntry.status = 'success';
          // Push all items from response to dataList
          if (Array.isArray(response)) {
            this.dataList.push(...response);
          }
          currentIndex++;
          fetchNext();
        },
        error: (error) => {
          console.error(`Error fetching URL ${urlEntry.url}:`, error);
          urlEntry.status = 'failure';
          currentIndex++;
          fetchNext();
        }
      });
    };

    fetchNext();
  }

  fetchUrlData(urlEntry: UrlEntry): void {
    if (urlEntry.status === 'in_process' || this.isProcessing) {
      return;
    }

    urlEntry.status = 'in_process';

    this.http.post<CodalDataItem[]>(
      `${environment.napi}/codal/codal-fetch-activity-reports-list`, 
      { url: urlEntry.url }
    ).subscribe({
      next: (response) => {
        urlEntry.status = 'success';
        // Push all items from response to dataList
        if (Array.isArray(response)) {
          this.dataList.push(...response);
        }
      },
      error: (error) => {
        console.error(`Error fetching URL ${urlEntry.url}:`, error);
        urlEntry.status = 'failure';
      }
    });
  }
}
