import{NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {LoginComponent} from "./pages/login/login.component";
import {CommonModule} from "@angular/common";
import {RegisterComponent} from "./pages/register/register.component";
import {BodyComponent} from "./pages/body/body.component";
import {LeasingTableComponent} from "./pages/crud/leasing-table/page/leasing-table/leasing-table.component";

const routes: Routes=[
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component:LoginComponent },
  {path:'register', component:RegisterComponent},
  {path: 'body', component: BodyComponent},
  {path:'leasing-table', component:LeasingTableComponent}
]

@NgModule({
  declarations:[],
  imports:[
    CommonModule,
    RouterModule.forRoot(routes)
  ],

  exports:[
    RouterModule
  ]
})

export class AppRoutingModule { }
