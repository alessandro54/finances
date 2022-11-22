import { InjectionToken, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

//import { HeaderComponent } from './pages/header/header.component';

import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { AppRoutingModule } from './app-routing.module';
import { MatCardModule } from '@angular/material/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RegisterComponent } from './pages/register/register.component';
import { HeaderComponent} from "./components/common/header/header.component";
import { FooterComponent} from "./components/common/footer/footer.component";
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { LeasingTableComponent } from './pages/crud/leasing-table/page/leasing-table/leasing-table.component';
import { LeasingAddValuesComponent } from './pages/crud/leasing-add-values/leasing-add-values/leasing-add-values.component';
import { LeasingDetailComponent } from './pages/crud/leasing-detail-component/leasing-detail-component/leasing-detail.component';
import { JwtHelperService, JwtModule, JWT_OPTIONS } from '@auth0/angular-jwt';
import { AuthGuardService } from './auth/auth-guard-service';
import {checkBudgets} from "@angular-devkit/build-angular/src/utils/bundle-calculator";
import { LayoutComponent } from './components/common/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CreateLeasingComponent } from './pages/leasing/create-leasing/create-leasing.component';



@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    HeaderComponent,
    FooterComponent,
    ContactUsComponent,
    LeasingTableComponent,
    LeasingAddValuesComponent,
    LeasingDetailComponent,
    LayoutComponent,
    DashboardComponent,
    CreateLeasingComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatSidenavModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    MatGridListModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatTabsModule,
    MatButtonToggleModule,
  ],
  providers: [
    AuthGuardService,
    { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
    JwtHelperService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
