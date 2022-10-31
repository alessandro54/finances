import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

//import { HeaderComponent } from './pages/header/header.component';

import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import {AppRoutingModule} from "./app-routing.module";
import {MatCardModule} from "@angular/material/card";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {HttpClientModule} from "@angular/common/http";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatSelectModule} from "@angular/material/select";
import {MatMenuModule} from "@angular/material/menu";
import {MatDividerModule} from "@angular/material/divider";
import {MatGridListModule} from "@angular/material/grid-list";
import {RouterModule} from "@angular/router";
import {MatTableModule} from "@angular/material/table";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatDialogModule} from "@angular/material/dialog";
import {MatInputModule} from "@angular/material/input";
import {MatTabsModule} from "@angular/material/tabs";
import {MatButtonToggleModule} from "@angular/material/button-toggle";
import { RegisterComponent } from './pages/register/register.component';
import { BodyComponent } from './pages/body/body.component';
import { HeaderComponent } from './pages/header/header.component';
import { FooterComponent } from './pages/footer/footer.component';
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { LeasingAlemanComponent } from './pages/crud/leasing/pages/leasing-aleman/pages/leasing-aleman/leasing-aleman.component';
import { LeasingTableComponent } from './pages/crud/leasing/pages/leasing-table/page/leasing-table/leasing-table.component';
import { LeasingAddValuesComponent } from './pages/crud/leasing/pages/leasing-add-values/leasing-add-values/leasing-add-values.component';
import { LeasingDetailComponent } from './pages/crud/leasing/pages/leasing-detail-component/leasing-detail-component/leasing-detail.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    BodyComponent,
    HeaderComponent,
    FooterComponent,
    ContactUsComponent,
    LeasingAlemanComponent,
    LeasingTableComponent,
    LeasingAddValuesComponent,
    LeasingDetailComponent,
    //HeaderComponent,
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
    MatTabsModule,
    MatButtonToggleModule,

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
