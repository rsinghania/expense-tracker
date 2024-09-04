import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Expense, ExpenseService } from '../../services/expense.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  transactions: Expense[] = [];
  filteredTransactions: Expense[] = [];
  filterForm: FormGroup;

  dataSource: MatTableDataSource<Expense>;
  displayedColumns: string[] = ['date', 'description', 'debit', 'credit', 'balance', 'category'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  barChartOptions: any;
  lineChartOptions: any;
  donutChartOptions: any;
  areaChartOptions: any;

  constructor(
    private transactionService: ExpenseService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      category: [''],
      minAmount: [''],
      maxAmount: ['']
    });

    this.dataSource = new MatTableDataSource(this.filteredTransactions);
  }

  ngOnInit() {
    this.transactionService.getExpenses().subscribe(transactions => {
      this.transactions = transactions;
      this.filteredTransactions = transactions;
      this.dataSource.data = this.filteredTransactions;
      this.updateCharts();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter() {
    const startDate = this.filterForm.get('startDate')?.value;
    const endDate = this.filterForm.get('endDate')?.value;
    const category = this.filterForm.get('category')?.value;
    const minAmount = this.filterForm.get('minAmount')?.value;
    const maxAmount = this.filterForm.get('maxAmount')?.value;

    this.filteredTransactions = this.transactions.filter(t => {
      const dateInRange = (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate);
      const categoryMatch = !category || t.category === category;
      const amount = t.debit > 0 ? t.debit : t.credit;
      const amountInRange = (!minAmount || amount >= minAmount) && (!maxAmount || amount <= maxAmount);
      return dateInRange && categoryMatch && amountInRange;
    });

    this.dataSource.data = this.filteredTransactions;
    this.updateCharts();
  }

  updateCharts() {
    this.updateBarChart();
    this.updateLineChart();
    this.updateDonutChart();
    this.updateAreaChart();
  }

  updateBarChart() {
    const categoryTotals = this.getCategoryTotals();
    this.barChartOptions = {
      series: [{
        name: 'Total Spending',
        data: Object.values(categoryTotals)
      }],
      chart: {
        type: 'bar',
        height: 350
      },
      xaxis: {
        categories: Object.keys(categoryTotals)
      },
      title: {
        text: 'Total Spending by Category'
      }
    };
  }

  updateLineChart() {
    const dailySpending = this.getDailySpending();
    this.lineChartOptions = {
      series: [{
        name: 'Daily Spending',
        data: Object.values(dailySpending)
      }],
      chart: {
        type: 'line',
        height: 350
      },
      xaxis: {
        categories: Object.keys(dailySpending),
        type: 'datetime'
      },
      title: {
        text: 'Daily Spending Trend'
      }
    };
  }

  updateDonutChart() {
    const categoryTotals = this.getCategoryTotals();
    this.donutChartOptions = {
      series: Object.values(categoryTotals),
      chart: {
        type: 'donut',
        height: 350
      },
      labels: Object.keys(categoryTotals),
      title: {
        text: 'Spending Distribution by Category'
      }
    };
  }

  updateAreaChart() {
    const cumulativeSpending = this.getCumulativeSpending();
    this.areaChartOptions = {
      series: [{
        name: 'Cumulative Spending',
        data: Object.values(cumulativeSpending)
      }],
      chart: {
        type: 'area',
        height: 350
      },
      xaxis: {
        categories: Object.keys(cumulativeSpending),
        type: 'datetime'
      },
      title: {
        text: 'Cumulative Spending Over Time'
      }
    };
  }

  getCategoryTotals() {
    return this.filteredTransactions.reduce((acc, t) => {
      if (t.debit > 0) {
        acc[t.category] = (acc[t.category] || 0) + t.debit;
      }
      return acc;
    }, {} as Record<string, number>);
  }

  getDailySpending() {
    return this.filteredTransactions.reduce((acc, t) => {
      const date = t.date.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + t.debit;
      return acc;
    }, {} as Record<string, number>);
  }

  getCumulativeSpending() {
    let cumulative = 0;
    return this.filteredTransactions
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .reduce((acc, t) => {
        const date = t.date.toISOString().split('T')[0];
        cumulative += t.debit;
        acc[date] = cumulative;
        return acc;
      }, {} as Record<string, number>);
  }

  searchTransactions(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.transactionService.uploadStatement(file).then(() => {
        console.log('CSV processed successfully');
      }).catch((error:any) => {
        console.error('Error processing CSV:', error);
      });
    }
  }

  generatePdfReport() {
    // Implement PDF report generation logic here
    console.log('Generating PDF report...');
  }
}