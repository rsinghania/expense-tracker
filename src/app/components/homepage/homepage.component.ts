import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';

@Component({
  selector: 'app-homepage',
  template: `
    <div class="upload-container">
      <input type="file" (change)="onFileSelected($event)" accept=".csv" #fileInput style="display: none;">
      <button mat-raised-button color="primary" (click)="fileInput.click()">Upload File</button>
    </div>
  `,
  styles: [`
    .upload-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
  `]
})
export class HomepageComponent {
  constructor(private router: Router, private expenseService: ExpenseService) {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.expenseService.uploadStatement(file).then(() => {
        this.router.navigate(['/dashboard']);
      });
    }
  }
}