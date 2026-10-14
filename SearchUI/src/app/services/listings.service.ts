
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Listing } from '../models/listing';

@Injectable({
  providedIn: 'root'
})
export class ListingsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api/listings';

  getListings(minPrice?: number): Observable<Listing[]> {
    if (minPrice !== undefined && minPrice !== null) {
      const params = new HttpParams().set('minPrice', minPrice.toString());
      return this.http.get<Listing[]>(this.apiUrl, { params });
    }
    return this.http.get<Listing[]>(this.apiUrl);
  }
}
