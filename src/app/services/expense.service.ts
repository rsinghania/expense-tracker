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

  private categoryKeywords = {
    'Groceries': ['supermarket', 'grocery', 'food'],
    'Dining': ['restaurant', 'cafe', 'food forum', 'FOOD FORUM NH10', 'SHRI SHYAM SBGD FOOD'],
    'Transportation': ['uber', 'lyft', 'taxi', 'fuel', 'gas', 'car', 'bike', 'motor'],
    'Shopping': ['amazon', 'ekart', 'jewellers', 'URMIL JEWELLERS', 'AMAZON SELLER SERVICE', 'Amazon Pay'],
    'Utilities': ['electricity', 'water', 'gas', 'internet'],
    'Healthcare': ['hospital', 'doctor', 'pharmacy', 'chemist', 'TRILOK CHEMIST', 'J M D MEDICOS'],
    'Investment': ['mutual fund', 'stocks', 'zerodha', 'AUTOBPay', 'PPFSI', 'Zerodha Broking Ltd'],
    'Rent': ['rent', 'lease'],
    'Insurance': ['insurance', 'policy'],
    'Entertainment': ['cinema', 'theater', 'netflix'],
    'Education': ['school', 'college', 'tuition'],
    'Travel': ['hotel', 'flight', 'airbnb'],
    'Personal Care': ['salon', 'spa'],
    'Gifts': ['gift'],
    'Charity': ['donation'],
    'Income': ['salary', 'interest', 'NEFT/IRIS SOFTWARE TECHNOLOGIES P'],
    'Transfer': ['transfer', 'neft', 'upi', 'ACH-CR', 'ACH-DR', 'NEFT'],
    'Loan': ['emi', 'loan', 'ACH-DR-RACPC KARKARDOOMA'],
    'Credit Card': ['creditcard', 'CreditCard Payment'],
    'ATM': ['atm', 'cash withdrawal'],
    'Digital Payment': ['PhonePe', 'eazypay'],
    'Automotive': ['Sagar Motors'],
    'Recurring Deposit': ['RD'],
    'Pension': ['APY'],
    'Service Payment': ['DroptheQ'],
    'Subscription': ['ECS/RAZORPAY SOFTWARE PRIVATE LIM'],
    'Tax Refund': ['NEFT/ITDTAX REFUND']
  };

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
        complete: (result: any) => {
          const startIndex = result.data.findIndex((row: any) => row[0] === 'Tran Date');
          if (startIndex === -1) {
            reject(new Error('Could not find transaction data in CSV'));
            return;
          }
          const headers = result.data[startIndex] as string[];
          const transactionData = result.data.slice(startIndex + 1);

          const filtered_data = transactionData.filter((row: any) => row.length == 7);

          const expenses = this.processCSVData(headers, filtered_data);
          this.expenses = [...expenses];
          this.updateExpenses();
          resolve();
        },
        error: (error: any) => {
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
      date: this.setDate(row[indexMap.date]),
      description: row[indexMap.description],
      debit: parseFloat(row[indexMap.debit]) || 0,
      credit: parseFloat(row[indexMap.credit]) || 0,
      balance: parseFloat(row[indexMap.balance]),
      category: this.categorizeTransaction(row[indexMap.description], parseFloat(row[indexMap.debit]) || 0)
    })).filter(expense => !isNaN(expense.date.getTime()));
  }

  private categorizeTransaction(description: string, amount: number): string {
    description = description.toLowerCase();

    // Check for income
    if (description.toLowerCase().includes('salary') || description.includes('interest')) {
      return 'Income';
    }

    // Check for investments
    if (description.toLowerCase().includes('mutual') || description.includes('zerodha')) {
      return 'Investment';
    }

    // Check for transfers
    if (description.toLowerCase().includes('upi') || description.includes('neft')) {
      return 'Transfer';
    }

    // Check for credit card payments
    if (description.toLowerCase().includes('creditcard')) {
      return 'Credit Card Payment';
    }

    // Check other categories
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => description.toLowerCase().includes(keyword.toLowerCase()))) {
        console.log(category);
        return category;
      }
    }

    // If no category is found
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

  private setDate(dateString: string): Date {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
}