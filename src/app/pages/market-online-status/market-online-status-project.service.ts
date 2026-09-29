import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OnlineMarketProject {
  name: string;
  filters: {
    codes: string[] | null;
    groups: string[] | null;
    humanPower: number | null;
    humanMoneyInflow: number | null;
    suspiciousTradingVolume: number | null;
    isBuyQueue: boolean | null;
    isSellQueue: boolean | null;
    isNegativeLast5Days: boolean | null;
    page: number;
    limit: number;
  };
}

export interface CreateOnlineMarketProjectRequest {
  name: string;
  filters: {
    codes: string[] | null;
    groups: string[] | null;
    humanPower: number | null;
    humanMoneyInflow: number | null;
    suspiciousTradingVolume: number | null;
    isBuyQueue: boolean | null;
    isSellQueue: boolean | null;
    isNegativeLast5Days: boolean | null;
    page: number;
    limit: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MarketOnlineStatusProjectService {
  private readonly apiUrl = `${environment.ktapi}/online-market-project`;
  private readonly apiUrlPlural = `${environment.ktapi}/online-market-projects`;

  constructor(private http: HttpClient) {}

  getProjects(): Observable<OnlineMarketProject[]> {
    return this.http.get<OnlineMarketProject[]>(this.apiUrlPlural);
  }

  createProject(request: CreateOnlineMarketProjectRequest): Observable<OnlineMarketProject> {
    return this.http.post<OnlineMarketProject>(this.apiUrl, request);
  }
}
