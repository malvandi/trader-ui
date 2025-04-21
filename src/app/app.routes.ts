import { Routes } from '@angular/router';
import { ActivityReportComponent } from './components/activity-report/activity-report.component';
import { GainComponent } from './components/gain/gain.component';
import { AdminComponent } from './components/admin/admin.component';

export const routes: Routes = [
  { path: '', redirectTo: 'activity-report', pathMatch: 'full' },
  { path: 'activity-report', component: ActivityReportComponent },
  { path: 'gain', component: GainComponent },
  { path: 'admin', component: AdminComponent }
];
