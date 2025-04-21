import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [NgFor],
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent {
  navItems = [
    { path: 'activity-report', label: 'Activity Report', icon: '📊' },
    { path: 'gain', label: 'Gain', icon: '💰' },
    { path: 'admin', label: 'Admin', icon: '⚙️' }
  ];

  constructor(public router: Router) {}

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.closeNav();
  }

  closeNav() {
    const sideNav = document.querySelector('.side-nav') as HTMLElement;
    if (sideNav) {
      sideNav.classList.remove('open');
    }
  }

  openNav() {
    const sideNav = document.querySelector('.side-nav') as HTMLElement;
    if (sideNav) {
      sideNav.classList.add('open');
    }
  }
}
