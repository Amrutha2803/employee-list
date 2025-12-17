import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeModel } from '../../model/employee';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './employee-form.component.html',
})
export class EmployeeFormComponent implements OnInit {
  employeeForm!: FormGroup;
  employeeObject: EmployeeModel = new EmployeeModel();
  employeeList: EmployeeModel[] = [];

  departments: string[] = ['HR', 'Finance', 'Engineering', 'Marketing', 'Sales', 'IT'];
  genders: string[] = ['Male', 'Female', 'Other'];

  mode: 'add' | 'edit' | 'view' = 'add';
  currentStep = 1;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as any;
    if (state?.employee) {
      this.employeeObject = state.employee;
      this.mode = state.mode || 'add';
    }
    if (state?.mode) {
      this.mode = state.mode;
    }
  }

  // Validator allowing +countrycode and separators (spaces/dashes).
  // It strips non-digit characters. Rules:
  // - If the value starts with an explicit +country code of +91, require the
  //   local part (digits after the country code) to be exactly 10 digits.
  // - Otherwise require at least 10 digits (and up to 15 accepted).
  mobileValidator(control: AbstractControl) {
    const v = control.value;
    if (v == null || String(v).trim() === '') return null; // required validator handles empty
    const str = String(v).trim();
    // detect leading +country (e.g. +91, +1, +44)
    const plusMatch = str.match(/^\s*\+(\d{1,3})/);
    const digits = str.replace(/\D/g, '');

    if (plusMatch) {
      const cc = plusMatch[1];
      if (cc === '91') {
        // local part = digits after country code
        const local = digits.slice(cc.length);
        return local.length === 10 ? null : { invalidPhone: true };
      }
      // other country codes: accept digit length between 10 and 15
      return digits.length >= 10 && digits.length <= 15 ? null : { invalidPhone: true };
    }

    // no explicit +country: require at least 10 digits (up to 15)
    return digits.length >= 10 && digits.length <= 15 ? null : { invalidPhone: true };
  }

  ngOnInit() {
    this.loadEmployees();
    this.createForm();
    if (this.mode === 'view') {
      this.employeeForm.disable();
      // When viewing, show the address/department step so Department is visible
      this.currentStep = 2;
    }
  }

  loadEmployees() {
    const oldData = localStorage.getItem('employeeData');
    if (oldData != null) {
      this.employeeList = JSON.parse(oldData);
    }
  }

  createForm() {
    this.employeeForm = new FormGroup({
      empId: new FormControl(this.employeeObject.empId),
      name: new FormControl(this.employeeObject.name, [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[A-Za-z\s'\-]+$/),
      ]),
      gender: new FormControl(this.employeeObject.gender),
      city: new FormControl(this.employeeObject.city),
      state: new FormControl(this.employeeObject.state),
      emailId: new FormControl(this.employeeObject.emailId, [
        Validators.required,
        Validators.email,
      ]),
      // Contact number validation: required and allow optional country code and separators
      contactNo: new FormControl(this.employeeObject.contactNo, [
        Validators.required,
        this.mobileValidator,
      ]),
      Department: new FormControl(this.employeeObject.Department),
      Address: new FormControl(this.employeeObject.Address),
      Pincode: new FormControl(this.employeeObject.Pincode, [
        Validators.required,
        Validators.minLength(6),
      ]),
    });
  }

  onSave() {
    this.employeeForm.markAllAsTouched();
    if (this.employeeForm.valid) {
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
      this.goBack();
    }
  }

  onUpdate() {
    this.employeeForm.markAllAsTouched();
    if (this.employeeForm.valid) {
      const record = this.employeeList.find(
        (m) => m.emailId == this.employeeForm.controls['emailId'].value
      );
      if (record != undefined) {
        record.name = this.employeeForm.controls['name'].value;
        record.city = this.employeeForm.controls['city'].value;
        record.state = this.employeeForm.controls['state'].value;
        record.contactNo = this.employeeForm.controls['contactNo'].value;
        record.Department = this.employeeForm.controls['Department'].value;
        record.gender = this.employeeForm.controls['gender'].value;
        record.Pincode = this.employeeForm.controls['Pincode'].value;
        record.Address = this.employeeForm.controls['Address'].value;
      }
      localStorage.setItem('employeeData', JSON.stringify(this.employeeList));
      this.showToast('Employee updated!', 'info');
      this.goBack();
    }
  }

  onReset() {
    this.employeeObject = new EmployeeModel();
    this.createForm();
  }

  goBack() {
    this.router.navigate(['/employee-list']);
  }

  // Multi-step form logic
  nextStep(): void {
    if (this.isStepValid(this.currentStep)) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  isStepValid(step: number): boolean {
    if (!this.employeeForm) return false;
    const stepRequired: Record<number, string[]> = {
      1: ['name', 'emailId', 'contactNo'],
      2: ['Department', 'city', 'state', 'Pincode'],
    };
    const controls = stepRequired[step] || [];
    let valid = true;
    controls.forEach((c) => {
      const ctrl = this.employeeForm.controls[c];
      if (ctrl) {
        ctrl.markAsTouched();
        if (ctrl.invalid) valid = false;
      }
    });
    return valid;
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
}
