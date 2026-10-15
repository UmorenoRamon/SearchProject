
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

  getListings(
    minPrice?: number,
    maxPrice?: number,
    minBedrooms?: number,
    city?: string,
    keyword?: string,
  ): Observable<Listing[]> {
    let params = new HttpParams();
    if (minPrice !== undefined && minPrice !== null) {
      params = params.set('minPrice', minPrice.toString());
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      params = params.set('maxPrice', maxPrice.toString());
    }
    if (minBedrooms !== undefined && minBedrooms !== null) {
      params = params.set('minBedrooms', minBedrooms.toString());
    }
    if (city !== undefined && city !== null && city.trim() !== '') {
      params = params.set('city', city.trim());
    }
    if (keyword !== undefined && keyword !== null && keyword.trim() !== '') {
      params = params.set('keyword', keyword.trim());
    }
    if (params.keys().length > 0) {
      return this.http.get<Listing[]>(this.apiUrl, { params });
    }
    return this.http.get<Listing[]>(this.apiUrl);
  }
}
