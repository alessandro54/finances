import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CommonModule } from '@angular/common';
import { RegisterComponent } from './pages/register/register.component';
import { BodyComponent } from './pages/body/body.component';
import { LeasingTableComponent } from './pages/crud/leasing-table/page/leasing-table/leasing-table.component';
import {ContactUsComponent} from "./pages/contact-us/contact-us.component";
import { AuthGuardService } from './auth/auth-guard-service';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: BodyComponent, canActivate: [AuthGuardService] },
  { path: 'leasing-table', component: LeasingTableComponent },
  {path: 'contactUs', component: ContactUsComponent}
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forRoot(routes)],

  exports: [RouterModule],
})
export class AppRoutingModule {}
