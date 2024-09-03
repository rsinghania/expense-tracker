import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as Papa from 'papaparse';

export interface Expense {
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private expenses: Expense[] = [];
  private expensesSubject = new BehaviorSubject<Expense[]>([]);

  constructor() {
    this.loadExpenses();
  }

  getExpenses() {
    return this.expensesSubject.asObservable();
  }

  async uploadStatement(file: File) {
    return new Promise<void>((resolve, reject) => {
      Papa.parse(file, {
        skipEmptyLines: true,
        complete: (result:any) => {
          const startIndex = result.data.findIndex((row: any) => row[0] === 'Tran Date');
          if (startIndex === -1) {
            reject(new Error('Could not find transaction data in CSV'));
            return;
          }
          const headers = result.data[startIndex] as string[];
          const transactionData = result.data.slice(startIndex + 1);

          const filtered_data = transactionData.filter((row:any) => row.length == 7);

          
          const expenses = this.processCSVData(headers, filtered_data);
          this.expenses = [...expenses];
          this.updateExpenses();
          resolve();
        },
        error: (error:any) => {
          console.error('Error parsing CSV:', error);
          reject(error);
        }
      });
    });
  }

  private processCSVData(headers: string[], data: any[]): Expense[] {
    const indexMap = {
      date: headers.indexOf('Tran Date'),
      description: headers.indexOf('PARTICULARS'),
      debit: headers.indexOf('DR'),
      credit: headers.indexOf('CR'),
      balance: headers.indexOf('BAL')
    };

  

    return data.map(row => ({
      date: setDate(row[0]),
      description: row[indexMap.description],
      debit: parseFloat(row[indexMap.debit]) || 0,
      credit: parseFloat(row[indexMap.credit]) || 0,
      balance: parseFloat(row[indexMap.balance]),
      category: this.categorizeExpense(row[indexMap.description])
    })).filter(expense => !isNaN(expense.date.getTime()));
  }

  private categorizeExpense(description: string): string {
    description = description.toLowerCase();
    if (description.includes('upi') || description.includes('p2m') || description.includes('p2a')) return 'UPI Payment';
    if (description.includes('ach')) return 'ACH Transaction';
    if (description.includes('neft')) return 'NEFT Transfer';
    if (description.includes('autobpay')) return 'Auto Payment';
    if (description.includes('credit card')) return 'Credit Card Payment';
    if (description.includes('mutual')) return 'Mutual Fund';
    return 'Other';
  }

  private updateExpenses() {
    this.expensesSubject.next([...this.expenses]);
    localStorage.setItem('expenses', JSON.stringify(this.expenses));
  }

  private loadExpenses() {
    const storedExpenses = localStorage.getItem('expenses');
    if (storedExpenses) {
      this.expenses = JSON.parse(storedExpenses);
      this.expensesSubject.next([...this.expenses]);
    }
  }
}

function setDate(dateString: string): any {
  const [day, month, year] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); 
  return date;
} 