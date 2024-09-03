import { Component, OnInit } from '@angular/core';
import { ApexAxisChartSeries, ApexOptions } from 'ng-apexcharts';
import { Expense, ExpenseService } from '../../services/expense.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  transactions: Expense[] = [];
  categoryChartOptions: any;
  monthlyTrendChartOptions!: any
  incomeVsExpenseChartOptions!: any
  dailyBalanceChartOptions!:any

  constructor(private expenseService: ExpenseService) {
    this.initializeChartOptions();
  }

  ngOnInit() {
    this.expenseService.getExpenses().subscribe(transactions => {
      this.transactions = transactions;
      this.updateCharts();
    });
  }

  initializeChartOptions() {
    this.categoryChartOptions = {
      series: [],
      chart: { type: 'pie', height: 350 },
      labels: [],
      title: { text: 'Expense Distribution by Category' }
    };

    this.monthlyTrendChartOptions = {
      series: [{ name: 'Expenses', data: [] }],
      chart: { type: 'line', height: 350 },
      xaxis: { categories: [] },
      title: { text: 'Monthly Expense Trend' }
    };

    this.incomeVsExpenseChartOptions = {
      series: [
        { name: 'Income', data: [] },
        { name: 'Expenses', data: [] }
      ],
      chart: { type: 'bar', height: 350 },
      xaxis: { categories: [] },
      title: { text: 'Income vs Expenses' }
    };

    this.dailyBalanceChartOptions = {
      series: [{ name: 'Balance', data: [] }],
      chart: { type: 'area', height: 350 },
      xaxis: { type: 'datetime' },
      title: { text: 'Daily Balance Trend' }
    };
  }

  updateCharts() {
    this.updateCategoryChart();
    this.updateMonthlyTrendChart();
    this.updateIncomeVsExpenseChart();
    this.updateDailyBalanceChart();
  }

  updateCategoryChart() {
    const categoryTotals = this.transactions.reduce((acc, transaction) => {
      if (transaction.debit > 0) {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.debit;
      }
      return acc;
    }, {} as Record<string, number>);

    this.categoryChartOptions.series = Object.values(categoryTotals);
    this.categoryChartOptions.labels = Object.keys(categoryTotals);
  }

  updateMonthlyTrendChart() {
    const monthlyExpenses = this.transactions.reduce((acc, transaction) => {
      const month = transaction.date.toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + transaction.debit;
      return acc;
    }, {} as Record<string, number>);

    this.monthlyTrendChartOptions.series = [{
      name: 'Expenses',
      data: Object.values(monthlyExpenses)
    }];
    this.monthlyTrendChartOptions.xaxis = {
      categories: Object.keys(monthlyExpenses)
    };
  }

  updateIncomeVsExpenseChart() {
    const monthlyData = this.transactions.reduce((acc, transaction) => {
      const month = transaction.date.toLocaleString('default', { month: 'short' });
      if (!acc[month]) acc[month] = { income: 0, expenses: 0 };
      acc[month].income += transaction.credit;
      acc[month].expenses += transaction.debit;
      return acc;
    }, {} as Record<string, { income: number, expenses: number }>);

    const months = Object.keys(monthlyData);
    const incomeData = months.map(month => monthlyData[month].income);
    const expenseData = months.map(month => monthlyData[month].expenses);

    this.incomeVsExpenseChartOptions.series = [
      { name: 'Income', data: incomeData },
      { name: 'Expenses', data: expenseData }
    ];
    this.incomeVsExpenseChartOptions.xaxis = { categories: months };
  }

  updateDailyBalanceChart() {
    const dailyBalance = this.transactions.map(transaction => ({
      x: transaction.date.getTime(),
      y: transaction.balance
    }));

    this.dailyBalanceChartOptions.series = [{
      name: 'Balance',
      data: dailyBalance
    }];
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.expenseService.uploadStatement(file).then(() => {
        console.log('CSV processed successfully');
      }).catch((error:any) => {
        console.error('Error processing CSV:', error);
      });
    }
  }
}