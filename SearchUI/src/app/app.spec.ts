import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError, Subject } from 'rxjs';

import { App } from './app';
import { ListingsService } from './services/listings.service';
import { Listing } from './models/listing';

describe('App', () => {
   let mockListingsService: {
    getListings: ReturnType<typeof vi.fn>;
   };

   const sampleListing: Listing = {
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
  };

  const sampleListing2: Listing = {
    id: '1002',
    source: 'MLS_B',
    address: '45 Beacon Street',
    city: 'Boston',
    state: 'MA',
    zip: '02108',
    price: 450000,
    bedrooms: 2,
    bathrooms: 1.0,
    sqft: 1100,
    latitude: 42.356,
    longitude: -71.065,
    listedDate: '2026-09-20',
    status: 'pending',
    description: 'Historic condo.',
  };

  beforeEach(async () => {
    mockListingsService = {
      getListings: vi.fn(() => of([sampleListing])),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        {
          provide: ListingsService,
          useValue: mockListingsService,
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Real Estate Listings');
  });

  it('requests listings when the component initializes', () => {
    const fixture = TestBed.createComponent(App);

    fixture.detectChanges();

    expect(mockListingsService.getListings).toHaveBeenCalledOnce();
  });

  it('displays listings returned by the service', () => {
    const fixture = TestBed.createComponent(App);

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('123 Main Street');
    expect(text).toContain('Boston');
    expect(text).toContain('650,000');
  });

  it('displays an error when the API request fails', () => {
    mockListingsService.getListings.mockReturnValue(
      throwError(() => new Error('API unavailable')),
    );

    const fixture = TestBed.createComponent(App);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Unable to load listings',
    );
  });

  it('shows the loading state while the request is pending', () => {
    const pendingRequest = new Subject<Listing[]>();

    mockListingsService.getListings.mockReturnValue(pendingRequest);

    const fixture = TestBed.createComponent(App);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Loading');

    pendingRequest.next([sampleListing]);
    pendingRequest.complete();

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('123 Main Street');
  });

  
  it('handles an empty listing response', () => {
    mockListingsService.getListings.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    // The request completed without an error.
    expect(text).not.toContain('Unable to load listings');

    // The component should render its empty-results state.
    // Adjust this assertion to match your actual app.html.
    expect(text).toContain('No listings');
  });

  it('renders the filter by min price input', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const label = compiled.querySelector('label[for="minPrice"]');
    const input = compiled.querySelector('#minPrice') as HTMLInputElement;

    expect(label?.textContent).toContain('Filter by Min Price');
    expect(input).toBeTruthy();
  });

  it('filters listings by min price', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#minPrice') as HTMLInputElement;

    expect(compiled.textContent).toContain('123 Main Street');
    expect(compiled.textContent).toContain('45 Beacon Street');
    expect(compiled.textContent).toContain('2 listings found');

    input.value = '500000';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('123 Main Street');
    expect(compiled.textContent).not.toContain('45 Beacon Street');
    expect(compiled.textContent).toContain('1 listings found');
  });

  it('shows no listings when min price exceeds all listing prices', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#minPrice') as HTMLInputElement;

    input.value = '900000';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('0 listings found');
    expect(compiled.textContent).toContain('No listings found.');
  });

  it('clears the min price filter when clear button is clicked', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#minPrice') as HTMLInputElement;

    input.value = '500000';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('1 listings found');

    const clearButton = compiled.querySelector('.clear-btn') as HTMLButtonElement;
    expect(clearButton).toBeTruthy();
    clearButton.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('2 listings found');
    expect(compiled.textContent).toContain('45 Beacon Street');
    expect(input.value).toBe('');
  });
});
