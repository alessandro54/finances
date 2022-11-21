import {Component, OnInit, ViewChild} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import {leasing_Dates} from "../../../leasing-add-values/model/leasing_Dates";
import {MatDialog} from "@angular/material/dialog";

import {LeasingAddValuesComponent} from "../../../leasing-add-values/leasing-add-values/leasing-add-values.component";
import {
  LeasingDetailComponent
} from "../../../leasing-detail-component/leasing-detail-component/leasing-detail.component";
import {leasingAddServices} from "../../../leasing-add-values/service/leasingAddService";

class MatPaginator {
}

@Component({
  selector: 'app-leasing-table',
  templateUrl: './leasing-table.component.html',
  styleUrls: ['./leasing-table.component.css']
})
export class LeasingTableComponent implements OnInit {
  dataSource: MatTableDataSource<any>;
  leasingDataGet: leasing_Dates;
  leasingData: leasing_Dates;
  displayedColumnsSolesBonos: string[] = ['id', 'IDoperacion', 'PrecioVenta', '%CutaInicial',
    'Prestamo', 'Frecuencia', 'N°deAños', 'N°Periiodos',
    'actions'];

  @ViewChild(MatPaginator, {static: true})
  paginator!: MatPaginator;

  constructor(private leasingaddservices: leasingAddServices, public dialog: MatDialog) {
    this.leasingData = {} as leasing_Dates;
    this.dataSource = new MatTableDataSource<any>();
    this.leasingDataGet = new leasing_Dates();
  }

  ngOnInit(): void {
    // this.dataSource.paginator = this.paginator; //corregir el paginator por alguna razon no funciona
    this.getAllLeasings();
  }

  openDialogAddLeasing() {
    const dialogRef = this.dialog.open(LeasingAddValuesComponent);

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  openDialogDetailLeasing() {
    const dialogRef = this.dialog.open(LeasingDetailComponent, {
      height: '95%',
      width: '100%'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  openDialogSaveLeasing() {
    const dialogRef = this.dialog.open(LeasingAddValuesComponent);

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
  deleteItem(id: number) {
    this.leasingaddservices.delete(id).subscribe((response: any) => {
      this.dataSource.data = this.dataSource.data.filter((o: leasing_Dates) => {
        return o.id !== id ? o : false;
      });
    });
    console.log(this.dataSource.data);
  }
  getLeasingById(id: number){
    this.leasingaddservices.getLeasingAcount(id).subscribe((response: any) =>{
      this.leasingDataGet = response;
    });
  }
  getAllLeasings() {
    this.leasingaddservices.getAll().subscribe( (response: any) => {
      this.dataSource.data = response;
    });
  }

}
