import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SideNavComponent } from '../side-nav/side-nav.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  title = 'Malvandi Trader';
  currentPage = '';

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects || event.url;
      this.currentPage = this.getPageName(url);
    });
  }

  private getPageName(url: string): string {
    if (url.includes('activity-report')) return 'Activity Report';
    if (url.includes('gain')) return 'Gain';
    if (url.includes('admin')) return 'Admin';
    if (url.includes('large-trades')) return 'Large Trades';
    if (url.includes('market-online-status')) return 'Market Online Status';
    if (url.includes('fetch-codal-data')) return 'Fetch Codal Data';
    return 'Activity Report';
  }

  toggleSideNav() {
    const sideNav = document.querySelector('.side-nav') as HTMLElement;
    if (sideNav) {
      if (sideNav.classList.contains('open')) {
        sideNav.classList.remove('open');
      } else {
        sideNav.classList.add('open');
      }
    }
  }
}
