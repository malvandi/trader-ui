import { Routes } from '@angular/router';
import { ActivityReportComponent } from './pages/activity-report/activity-report.component';
import { GainComponent } from './pages/gain/gain.component';
import { AdminComponent } from './pages/admin/admin.component';
import { StockDetailComponent } from './pages/stock-detail/stock-detail.component';
import { FetchCodalDataComponent } from './pages/fetch-codal-data/fetch-codal-data.component';

export const routes: Routes = [
  { path: '', redirectTo: 'activity-report', pathMatch: 'full' },
  { path: 'activity-report', component: ActivityReportComponent },
  { path: 'gain', component: GainComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'fetch-codal-data', component: FetchCodalDataComponent },
  { path: 'stock-details/:id', component: StockDetailComponent }
];
