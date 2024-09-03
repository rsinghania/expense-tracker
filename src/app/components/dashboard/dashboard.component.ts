import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ExpenseService, Expense } from '../../services/expense.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Expense Dashboard</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div id="chart">
          <apx-chart
            [series]="chartOptions.series"
            [chart]="chartOptions.chart"
            [labels]="chartOptions.labels"
            [responsive]="chartOptions.responsive"
          ></apx-chart>
        </div>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button (click)="goToHomepage()">Back to Homepage</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    #chart {
      max-width: 650px;
      margin: 35px auto;
    }
  `]
})
export class DashboardComponent implements OnInit {
  expenses: Expense[] = [];
  chartOptions: any;

  constructor(private router: Router, private expenseService: ExpenseService) {
    this.chartOptions = {
      series: [],
      chart: {
        width: 380,
        type: 'pie',
      },
      labels: [],
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };
  }

  ngOnInit() {
    this.expenseService.getExpenses().subscribe(expenses => {
      this.expenses = expenses;
      this.updateChart();
    });
  }

  updateChart() {
    const categoryTotals = this.expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.debit;
      return acc;
    }, {} as Record<string, number>);

    this.chartOptions.series = Object.values(categoryTotals);
    this.chartOptions.labels = Object.keys(categoryTotals);
  }

  goToHomepage() {
    this.router.navigate(['/']);
  }
}