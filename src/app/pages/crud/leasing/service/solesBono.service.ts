import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {SolesBono} from "../model/solesBono";
import {Observable, throwError} from "rxjs";
import {catchError, retry} from "rxjs/operators";
import {Injectable} from "@angular/core";


@Injectable({
  providedIn: 'root'
})

export class solesBonosService {
  basePath = 'http://localhost:3000/solesBonos'

  httpOptions = {
    headers: new HttpHeaders( {
      'Content-Type': 'application/json',
    })
  }

  constructor(private http:HttpClient) { }

  getAll(): Observable<SolesBono> {
    return this.http.get<SolesBono>(this.basePath, this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError));
  }

  getSolesAccount(id: number): Observable<SolesBono> {
    return this.http.get<SolesBono>(`${this.basePath}/${id}`)
      .pipe(
        retry(2),
        catchError(this.handleError));
  }

  create(item: any): Observable<SolesBono> {
    return this.http.post<SolesBono>(this.basePath, JSON.stringify(item), this.httpOptions)
      .pipe(
        retry(2),
        catchError(this.handleError));
  }

  update(item: any, id: number): Observable<SolesBono> {
    return this.http.put<SolesBono>(`${this.basePath}/${id}`, JSON.stringify(item), this.httpOptions)
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
