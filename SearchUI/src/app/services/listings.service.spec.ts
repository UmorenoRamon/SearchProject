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

  it('requests listings with minPrice query parameter when provided', () => {
    service.getListings(500000).subscribe((listings) => {
      expect(listings.length).toBe(1);
      expect(listings[0].price).toBe(650000);
    });

    const request = httpTestingController.expectOne(
      'http://localhost:5000/api/listings?minPrice=500000',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('minPrice')).toBe('500000');

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

  it('requests listings with maxPrice query parameter when provided', () => {
    service.getListings(undefined, 800000).subscribe((listings) => {
      expect(listings.length).toBe(1);
      expect(listings[0].price).toBe(650000);
    });

    const request = httpTestingController.expectOne(
      'http://localhost:5000/api/listings?maxPrice=800000',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('maxPrice')).toBe('800000');

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

  it('requests listings with minBedrooms query parameter when provided', () => {
    service.getListings(undefined, undefined, 3).subscribe((listings) => {
      expect(listings.length).toBe(1);
      expect(listings[0].bedrooms).toBe(3);
    });

    const request = httpTestingController.expectOne(
      'http://localhost:5000/api/listings?minBedrooms=3',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('minBedrooms')).toBe('3');

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

  it('requests listings with city query parameter when provided', () => {
    service.getListings(undefined, undefined, undefined, 'Boston').subscribe((listings) => {
      expect(listings.length).toBe(1);
      expect(listings[0].city).toBe('Boston');
    });

    const request = httpTestingController.expectOne(
      'http://localhost:5000/api/listings?city=Boston',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('city')).toBe('Boston');

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

  it('requests listings with keyword query parameter when provided', () => {
    service.getListings(undefined, undefined, undefined, undefined, 'kitchen').subscribe((listings) => {
      expect(listings.length).toBe(1);
      expect(listings[0].description).toContain('kitchen');
    });

    const request = httpTestingController.expectOne(
      'http://localhost:5000/api/listings?keyword=kitchen',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('keyword')).toBe('kitchen');

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
        description: 'Spacious home near downtown with updated kitchen.',
      },
    ]);
  });
});