import { Component } from '@angular/core';
import { Router } from '@angular/router';
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
    this.router.events.subscribe(() => {
      const url = this.router.url;
      this.currentPage = this.getPageName(url);
    });
  }

  private getPageName(url: string): string {
    if (url.includes('activity-report')) return 'Activity Report';
    if (url.includes('gain')) return 'Gain';
    if (url.includes('admin')) return 'Admin';
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
