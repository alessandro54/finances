import {Component, OnInit, ViewChild} from '@angular/core';
import {FormGroup, FormBuilder} from "@angular/forms";
import {NgForm} from "@angular/forms";
import {User} from "../../model/User";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {UserService} from "../../services/user.service";
import {MatTableDataSource} from "@angular/material/table";



@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  public signupForm !:FormGroup
  logo = "assets/logo_small.png"
  userData:User;
  dataSource: MatTableDataSource<any>;
  displayedColumns: string[]=['id','name','lastname','gmail','_password'];

  @ViewChild('userForm', {static: false})
  employeeForm!: NgForm;

  @ViewChild(MatPaginator, {static: true})
  paginator!: MatPaginator;

  @ViewChild(MatSort)
  sort!: MatSort;

  isEditMode = false;

  constructor(private userService:UserService) {
    this.userData = {} as User;
    this.dataSource = new MatTableDataSource<any>();
  }

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;
  }
  editItem(element: User) {
    //this.userData = _.cloneDeep(element);
    //this.isEditMode = true;
  }
  cancelEdit() {
    this.isEditMode = false;
    this.employeeForm.resetForm();
  }
  signUp(){
    this.userData.id = 0;
    this.userService.create(this.userData).subscribe((response: any) => {
      this.dataSource.data.push( {...response});
      this.dataSource.data = this.dataSource.data.map((o: any) => { return o; });
    });
  }
  onSubmit() {
    if (this.employeeForm.form.valid) {
      console.log('valid');
      if (this.isEditMode) {
        console.log('about to update');

      } else {
        console.log('about to add');
        this.signUp();
      }
      this.cancelEdit();
    } else {
      console.log('Invalid data');
    }
  }
}
