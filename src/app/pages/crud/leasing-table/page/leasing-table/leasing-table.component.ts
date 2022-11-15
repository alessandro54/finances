import {Component, OnInit, ViewChild} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import {leasing_Dates} from "../../../leasing-add-values/model/leasing_Dates";
import {MatDialog} from "@angular/material/dialog";
import {solesBonosService} from "../../../leasing-add-values/service/solesBono.service";
import {LeasingAddValuesComponent} from "../../../leasing-add-values/leasing-add-values/leasing-add-values.component";
import {
  LeasingDetailComponent
} from "../../../leasing-detail-component/leasing-detail-component/leasing-detail.component";

class MatPaginator {
}

@Component({
  selector: 'app-leasing-table',
  templateUrl: './leasing-table.component.html',
  styleUrls: ['./leasing-table.component.css']
})
export class LeasingTableComponent implements OnInit {
    dataSource: MatTableDataSource<any>;
  solesBonoData: leasing_Dates;
  displayedColumnsSolesBonos: string[] = ['id', 'IDoperacion', 'PrecioVenta', '%CutaInicial',
    'Prestamo', 'Frecuencia', 'N°deAños', 'N°Periiodos',
    'actions'];

  @ViewChild(MatPaginator, {static: true})
  paginator!: MatPaginator;

  constructor(private solesBonoService: solesBonosService, public dialog: MatDialog) {
    this.solesBonoData = {} as leasing_Dates;
    this.dataSource = new MatTableDataSource<any>();
  }

  ngOnInit(): void {
    // this.dataSource.paginator = this.paginator; //corregir el paginator por alguna razon no funciona
    this.getAllLeasings();
  }

  getAllLeasings() {
    this.solesBonoService.getAll().subscribe( (response: any) => {
      this.dataSource.data = response;
    });
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
    this.solesBonoService.delete(id).subscribe((response: any) => {
      this.dataSource.data = this.dataSource.data.filter((o: leasing_Dates) => {
        return o.id !== id ? o : false;
      });
    });
    console.log(this.dataSource.data);
  }

}
