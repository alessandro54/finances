import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {User} from "../../model/User";
import {Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {UserService} from "../../services/user.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  logo = "assets/logo_leasing.png"
  public loginForm!: FormGroup;
  dataUser: User;

  show: boolean = false;

  constructor(private formBuilder: FormBuilder, private http: HttpClient,
              private router: Router, private userservice: UserService) {
    this.dataUser = {} as User;
  }

  password() {
    this.show = !this.show;
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: [''],
      password: ['']
    })
  }

  login(){
    this.http.get<any>("http://localhost:3000/user")
      .subscribe(res=>{
          const user =res.find((a:any)=>{
            this.dataUser=a;
            return a.email===this.loginForm.value.email&&a.password===this.loginForm.value.password
          });
          if(user){
            alert("login successfully");
            this.loginForm.reset();
            this.userservice.CurrentdataUser=this.dataUser
            this.router.navigate(['body'])
          }
          else{
            alert("User not found");
          }
        },
        err=>{
          alert("something went wrong");
        })
  }
}
