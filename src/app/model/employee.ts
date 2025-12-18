export class EmployeeModel {
  empId: number;
  name: string;
  gender: string;
  city: string;
  state: string;
  designation: string;
  country: string;
  emailId: string;
  contactNo: string;
  Department: string;
  Address: string;
  Pincode: string;

  constructor() {
    this.empId = 1;
    this.name = '';
    this.gender = '';
    this.city = '';
    this.state = '';
    this.designation = '';
    this.country = '';
    this.emailId = '';
    this.contactNo = '';
    this.Department = '';
    this.Address = '';
    this.Pincode = '';
  }
}
