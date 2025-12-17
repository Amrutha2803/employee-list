import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeModel } from './model/employee';
//import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('employee-list');

  employeeForm!: FormGroup;
  employeeObject: EmployeeModel = new EmployeeModel();
  employeeList: EmployeeModel[] = [];
  ascending: boolean = true;
  lastSortedColumn: string = '';

  // Pagination properties
  pageSize = 5;
  pageSizes = [5, 10, 20, 50];
  currentPage = 1;

  // Departments for select
  departments: string[] = ['HR', 'Finance', 'Engineering', 'Marketing', 'Sales', 'IT'];
  // Genders for radio inputs
  genders: string[] = ['Male', 'Female', 'Other'];

  constructor() {
    this.createForm();
    //debugger;
    const oldData = localStorage.getItem('employeeData');
    if (oldData != null) {
      const empDataArray = JSON.parse(oldData);
      this.employeeList = empDataArray;
    }
  }

  // Toast notification method
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

  // Reset form
  onReset() {
    this.employeeObject = new EmployeeModel();
    this.createForm();
  }

  // Create form
  createForm() {
    this.employeeForm = new FormGroup({
      empId: new FormControl(this.employeeObject.empId),
      name: new FormControl(this.employeeObject.name, [Validators.required]),
      gender: new FormControl(this.employeeObject.gender),
      city: new FormControl(this.employeeObject.city),
      state: new FormControl(this.employeeObject.state),
      emailId: new FormControl(this.employeeObject.emailId, [
        Validators.required,
        Validators.email,
      ]),
      contactNo: new FormControl(this.employeeObject.contactNo),
      Department: new FormControl(this.employeeObject.Department),
      //Address: new FormControl(this.employeeObject.Address),
      Pincode: new FormControl(this.employeeObject.Pincode, [
        Validators.required,
        Validators.minLength(6),
      ]),
    });
  }

  // Save record
  onSave() {
    //debugger;
    const oldData = localStorage.getItem('employeeData');
    if (oldData != null) {
      const empDataArray = JSON.parse(oldData);
      this.employeeForm.controls['empId'].setValue(empDataArray.length + 1);
      this.employeeList.unshift(this.employeeForm.value);
    } else {
      this.employeeList.unshift(this.employeeForm.value);
    }
    localStorage.setItem('employeeData', JSON.stringify(this.employeeList));
    this.showToast('Employee saved successfully!', 'success');
    this.onReset();
  }

  // Search records
  onSearch(event: any) {
    //debugger;
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
  // Sort records
  onSort(column: string) {
    //debugger;
    const oldData = localStorage.getItem('employeeData');
    this.ascending = true;
    if (oldData != null) {
      const empDataArray = JSON.parse(oldData);
      this.employeeList = empDataArray.sort((a: any, b: any) => {
        if (a[column] < b[column]) {
          return this.ascending ? -1 : 1;
        } else if (a[column] > b[column]) {
          return this.ascending ? 1 : -1;
        } else {
          return 0;
        }
      });
      this.ascending = !this.ascending;
    }
  }

  // Edit record
  onEdit(item: EmployeeModel) {
    this.employeeObject = item;
    this.createForm();
  }

  // Update record
  onUpdate() {
    //debugger;
    const record = this.employeeList.find(
      (m) => m.emailId == this.employeeForm.controls['emailId'].value
    );
    if (record != undefined) {
      record.name = this.employeeForm.controls['name'].value;
      record.city = this.employeeForm.controls['city'].value;
      record.state = this.employeeForm.controls['state'].value;
      record.contactNo = this.employeeForm.controls['contactNo'].value;
      record.Department = this.employeeForm.controls['Department'].value;
      //record.Address = this.employeeForm.controls['Address'].value;
      record.gender = this.employeeForm.controls['gender'].value;
      record.Pincode = this.employeeForm.controls['Pincode'].value;
    }
    localStorage.setItem('employeeData', JSON.stringify(this.employeeList));
    this.showToast('Employee updated!', 'info');
    this.onReset();
  }

  // Delete record
  onDelete(id: number) {
    const index = this.employeeList.findIndex((m) => m.empId == id);
    if (index > -1) {
      this.employeeList.splice(index, 1);
      localStorage.setItem('employeeData', JSON.stringify(this.employeeList));
      this.changePage(1); // Reset to first page after delete
    }
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
    // Your logic here
  }

  paginatedEmployees(): EmployeeModel[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return (this.employeeList || []).slice(start, start + this.pageSize);
  }
}
