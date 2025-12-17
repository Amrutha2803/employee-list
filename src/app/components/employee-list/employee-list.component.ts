import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeModel } from '../../model/employee';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.css',
})
export class EmployeeListComponent implements OnInit {
  employeeList: EmployeeModel[] = [];
  ascending: boolean = true;
  lastSortedColumn: string = '';
  // Delete confirmation state
  showDeleteConfirm: boolean = false;
  pendingDeleteId: number | null = null;
  // If true, show confirmation; stored in localStorage as 'confirmBeforeDelete'
  confirmBeforeDelete = localStorage.getItem('confirmBeforeDelete') !== 'false';
  dontAskAgainChecked = false;

  // Pagination properties
  pageSize = 5;
  pageSizes = [5, 10, 20, 50];
  currentPage = 1;

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    const oldData = localStorage.getItem('employeeData');
    if (oldData != null) {
      const empDataArray = JSON.parse(oldData);
      this.employeeList = empDataArray;
    }
  }

  onSearch(event: any) {
    const searchKey = event.target.value.toLowerCase();
    const oldData = localStorage.getItem('employeeData');
    if (oldData != null) {
      const empDataArray = JSON.parse(oldData);
      this.employeeList = empDataArray.filter(
        (emp: EmployeeModel) =>
          emp.name.toLowerCase().includes(searchKey) ||
          emp.empId.toString().toLowerCase().includes(searchKey) ||
          emp.Department.toLowerCase().includes(searchKey) ||
          emp.city.toLowerCase().includes(searchKey)
      );
    }
  }

  onSort(column: string) {
    // Use the currently displayed list so filtering/search remains in effect.
    if (!this.employeeList || this.employeeList.length === 0) return;

    if (this.lastSortedColumn === column) {
      this.ascending = !this.ascending;
    } else {
      this.ascending = true;
      this.lastSortedColumn = column;
    }

    const dir = this.ascending ? 1 : -1;

    this.employeeList = [...this.employeeList].sort((a: any, b: any) => {
      // Map 'srno' to empId
      const key = column === 'srno' ? 'empId' : column;

      let va = a && a[key] != null ? a[key] : '';
      let vb = b && b[key] != null ? b[key] : '';

      // Numeric compare when both are numbers (or numeric strings)
      const na = Number(va);
      const nb = Number(vb);
      if (!isNaN(na) && !isNaN(nb)) {
        return (na - nb) * dir;
      }

      // String compare: normalize and use localeCompare with numeric option
      const sa = String(va).trim().toLowerCase();
      const sb = String(vb).trim().toLowerCase();
      return sa.localeCompare(sb, undefined, { numeric: true }) * dir;
    });
  }

  onEdit(item: EmployeeModel) {
    // Navigate to form with edit mode
    this.router.navigate(['/employee-form'], { state: { employee: item, mode: 'edit' } });
  }

  requestDelete(id: number) {
    this.pendingDeleteId = id;
    // Always show confirmation modal when delete is requested.
    // The checkbox remains for the user's choice but we will not persist
    // an opt-out — the popup will appear every time.
    this.dontAskAgainChecked = false;
    this.showDeleteConfirm = true;
  }

  // perform the actual deletion (called from modal Confirm or directly)
  performDelete() {
    const id = this.pendingDeleteId;
    if (id == null) return;
    const index = this.employeeList.findIndex((m) => m.empId == id);
    if (index > -1) {
      this.employeeList.splice(index, 1);
      localStorage.setItem('employeeData', JSON.stringify(this.employeeList));
      this.showToast('Employee deleted!', 'error');
      this.changePage(1);
    }
    this.pendingDeleteId = null;
    this.showDeleteConfirm = false;
    // Do not persist the 'don't ask again' preference. Always show the
    // confirmation on subsequent deletes.
    this.dontAskAgainChecked = false;
  }

  cancelDelete() {
    this.pendingDeleteId = null;
    this.dontAskAgainChecked = false;
    this.showDeleteConfirm = false;
  }

  viewDetails(item: EmployeeModel) {
    // Navigate to form with view mode
    this.router.navigate(['/employee-form'], { state: { employee: item, mode: 'view' } });
  }

  // Pagination methods
  totalPages(): number {
    return Math.max(1, Math.ceil((this.employeeList?.length || 0) / this.pageSize));
  }

  pages(): number[] {
    const total = this.totalPages();
    const arr: number[] = [];
    for (let i = 1; i <= total; i++) arr.push(i);
    return arr;
  }

  changePage(page: number) {
    const total = this.totalPages();
    if (page < 1) page = 1;
    if (page > total) page = total;
    this.currentPage = page;
  }

  changePageSize(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.pageSize = Number(value);
    this.currentPage = 1;
  }

  paginatedEmployees(): EmployeeModel[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return (this.employeeList || []).slice(start, start + this.pageSize);
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    const alertClass = {
      success: 'alert-success',
      error: 'alert-danger',
      info: 'alert-info',
      warning: 'alert-warning',
    }[type];

    const toast = document.createElement('div');
    toast.className = `alert ${alertClass} position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  goToForm() {
    // Navigate to form in add mode
    this.router.navigate(['/employee-form'], { state: { mode: 'add' } });
  }
}
