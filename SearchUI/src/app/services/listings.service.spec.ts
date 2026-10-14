import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';

import { ListingsService } from './listings.service';

describe('ListingsService', () => {
  let service: ListingsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ListingsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('requests listings from the API', () => {
    service.getListings().subscribe((listings) => {
      expect(listings.length).toBe(1);
      expect(listings[0].address).toBe('123 Main Street');
    });

    const request = httpTestingController.expectOne(
      'http://localhost:5000/api/listings',
    );

    expect(request.request.method).toBe('GET');

    request.flush([
      {
        id: '1001',
        source: 'MLS_A',
        address: '123 Main Street',
        city: 'Boston',
        state: 'MA',
        zip: '02110',
        price: 650000,
        bedrooms: 3,
        bathrooms: 2.5,
        sqft: 1800,
        latitude: 42.357,
        longitude: -71.058,
        listedDate: '2026-09-15',
        status: 'active',
        description: 'Spacious home near downtown.',
      },
    ]);
  });
});