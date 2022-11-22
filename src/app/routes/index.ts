import { LoginComponent } from '../pages/login/login.component';
import { Routes } from '@angular/router';
import { RegisterComponent } from '../pages/register/register.component';
import { LeasingTableComponent } from '../pages/crud/leasing-table/page/leasing-table/leasing-table.component';
import {ContactUsComponent} from "../pages/contact-us/contact-us.component";
import { AuthGuardService } from '../auth/auth-guard-service';
import {DashboardComponent} from "../pages/dashboard/dashboard.component";

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuardService] },
  { path: 'leasing-table', component: LeasingTableComponent },
  {path: 'contactUs', component: ContactUsComponent}
];
