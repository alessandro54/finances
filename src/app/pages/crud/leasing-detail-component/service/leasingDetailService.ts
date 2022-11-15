import {Injectable} from "@angular/core";
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {Observable, throwError} from "rxjs";

import {catchError, retry} from "rxjs/operators";
import {Leasing_Out} from "../../leasing-table/model/Leasing_Out";

@Injectable({
  providedIn:'root'
})

export class leasingDetailService{
  basePath = 'http://localhost:3000/leasingOut'

  httpOptions = {
    headers: new HttpHeaders( {
      'Content-Type': 'application/json',
    })
  }
  constructor(private http:HttpClient) { }

  getAll(): Observable<Leasing_Out> {
    return this.http.get<Leasing_Out>(this.basePath, this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError));
  }

  getSolesAccount(id: number): Observable<Leasing_Out> {
    return this.http.get<Leasing_Out>(`${this.basePath}/${id}`)
      .pipe(
        retry(2),
        catchError(this.handleError));
  }

  create(item: any): Observable<Leasing_Out> {
    return this.http.post<Leasing_Out>(this.basePath, JSON.stringify(item), this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError));
  }

  update(item: any, id: number): Observable<Leasing_Out> {
    return this.http.put<Leasing_Out>(`${this.basePath}/${id}`, JSON.stringify(item), this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError));
  }

  delete(id: number) {
    return this.http.delete(`${this.basePath}/${id}`, this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.log(`An error occurred: ${error.error.message}`);
    }
    else {
      console.error(
        `Backend returned code ${error.status}, body was: ${error.error}`
      );
    }
    return throwError('Something happened with request, please try again later');
  }
}
