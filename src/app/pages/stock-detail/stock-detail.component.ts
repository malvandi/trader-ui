import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stock-detail-container">
      <h2>Stock Details</h2>
      <p>Stock ID: {{ stockId }}</p>
    </div>
  `,
  styles: [`
    .stock-detail-container {
      padding: 20px;
    }
  `]
})
export class StockDetailComponent implements OnInit {
  stockId: number | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.stockId = +params['id'];
    });
  }
}
