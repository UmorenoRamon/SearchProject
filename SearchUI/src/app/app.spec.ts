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

  const sampleListing3: Listing = {
    id: '2001',
    source: 'MLS_A',
    address: '10 Oak Avenue',
    city: 'Cambridge',
    state: 'MA',
    zip: '02139',
    price: 500000,
    bedrooms: 2,
    bathrooms: 1.0,
    sqft: 1100,
    latitude: 42.373,
    longitude: -71.109,
    listedDate: '2026-09-22',
    status: 'sold',
    description: 'Cozy home with garden.',
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

    const clearButton = input.parentElement?.querySelector('.clear-btn') as HTMLButtonElement;
    expect(clearButton).toBeTruthy();
    clearButton.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('2 listings found');
    expect(compiled.textContent).toContain('45 Beacon Street');
    expect(input.value).toBe('');
  });

  it('renders the filter by max price input', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const label = compiled.querySelector('label[for="maxPrice"]');
    const input = compiled.querySelector('#maxPrice') as HTMLInputElement;

    expect(label?.textContent).toContain('Filter by Max Price');
    expect(input).toBeTruthy();
  });

  it('filters listings by max price', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#maxPrice') as HTMLInputElement;

    expect(compiled.textContent).toContain('123 Main Street');
    expect(compiled.textContent).toContain('45 Beacon Street');
    expect(compiled.textContent).toContain('2 listings found');

    input.value = '500000';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).not.toContain('123 Main Street');
    expect(compiled.textContent).toContain('45 Beacon Street');
    expect(compiled.textContent).toContain('1 listings found');
  });

  it('shows no listings when max price is below all listing prices', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#maxPrice') as HTMLInputElement;

    input.value = '400000';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('0 listings found');
    expect(compiled.textContent).toContain('No listings found.');
  });

  it('clears the max price filter when clear button is clicked', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#maxPrice') as HTMLInputElement;

    input.value = '500000';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('1 listings found');

    const clearButton = input.parentElement?.querySelector('.clear-btn') as HTMLButtonElement;
    expect(clearButton).toBeTruthy();
    clearButton.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('2 listings found');
    expect(compiled.textContent).toContain('123 Main Street');
    expect(input.value).toBe('');
  });

  it('renders the filter by min bedrooms input', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const label = compiled.querySelector('label[for="minBedrooms"]');
    const input = compiled.querySelector('#minBedrooms') as HTMLInputElement;

    expect(label?.textContent).toContain('Filter by Min Bedrooms');
    expect(input).toBeTruthy();
  });

  it('filters listings by min bedrooms', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#minBedrooms') as HTMLInputElement;

    expect(compiled.textContent).toContain('123 Main Street');
    expect(compiled.textContent).toContain('45 Beacon Street');
    expect(compiled.textContent).toContain('2 listings found');

    input.value = '3';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('123 Main Street');
    expect(compiled.textContent).not.toContain('45 Beacon Street');
    expect(compiled.textContent).toContain('1 listings found');
  });

  it('shows no listings when min bedrooms exceeds all listing bedroom counts', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#minBedrooms') as HTMLInputElement;

    input.value = '5';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('0 listings found');
    expect(compiled.textContent).toContain('No listings found.');
  });

  it('clears the min bedrooms filter when clear button is clicked', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#minBedrooms') as HTMLInputElement;

    input.value = '3';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('1 listings found');

    const clearButton = input.parentElement?.querySelector('.clear-btn') as HTMLButtonElement;
    expect(clearButton).toBeTruthy();
    clearButton.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('2 listings found');
    expect(compiled.textContent).toContain('45 Beacon Street');
    expect(input.value).toBe('');
  });

  it('filters listings combining minPrice, maxPrice, and minBedrooms', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const minPriceInput = compiled.querySelector('#minPrice') as HTMLInputElement;
    const maxPriceInput = compiled.querySelector('#maxPrice') as HTMLInputElement;
    const minBedroomsInput = compiled.querySelector('#minBedrooms') as HTMLInputElement;

    minPriceInput.value = '400000';
    minPriceInput.dispatchEvent(new Event('input'));

    maxPriceInput.value = '700000';
    maxPriceInput.dispatchEvent(new Event('input'));

    minBedroomsInput.value = '3';
    minBedroomsInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    expect(compiled.textContent).toContain('1 listings found');
    expect(compiled.textContent).toContain('123 Main Street');
    expect(compiled.textContent).not.toContain('45 Beacon Street');
  });

  it('renders the filter by city input', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const label = compiled.querySelector('label[for="city"]');
    const input = compiled.querySelector('#city') as HTMLInputElement;

    expect(label?.textContent).toContain('Filter by City');
    expect(input).toBeTruthy();
  });

  it('filters listings by city', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2, sampleListing3]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#city') as HTMLInputElement;

    expect(compiled.textContent).toContain('3 listings found');

    input.value = 'Cambridge';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('1 listings found');
    expect(compiled.textContent).toContain('10 Oak Avenue');
    expect(compiled.textContent).not.toContain('123 Main Street');
    expect(compiled.textContent).not.toContain('45 Beacon Street');
  });

  it('shows no listings when city does not match any property', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2, sampleListing3]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#city') as HTMLInputElement;

    input.value = 'Chicago';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('0 listings found');
    expect(compiled.textContent).toContain('No listings found.');
  });

  it('clears the city filter when clear button is clicked', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2, sampleListing3]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#city') as HTMLInputElement;

    input.value = 'Cambridge';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('1 listings found');

    const clearButton = input.parentElement?.querySelector('.clear-btn') as HTMLButtonElement;
    expect(clearButton).toBeTruthy();
    clearButton.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('3 listings found');
    expect(compiled.textContent).toContain('123 Main Street');
    expect(input.value).toBe('');
  });

  it('renders the filter by keyword input', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const label = compiled.querySelector('label[for="keyword"]');
    const input = compiled.querySelector('#keyword') as HTMLInputElement;

    expect(label?.textContent).toContain('Filter by Keyword');
    expect(input).toBeTruthy();
  });

  it('filters listings by keyword matching description', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2, sampleListing3]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#keyword') as HTMLInputElement;

    expect(compiled.textContent).toContain('3 listings found');

    input.value = 'garden';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('1 listings found');
    expect(compiled.textContent).toContain('10 Oak Avenue');
    expect(compiled.textContent).not.toContain('123 Main Street');
    expect(compiled.textContent).not.toContain('45 Beacon Street');
  });

  it('shows no listings when keyword does not match any description', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2, sampleListing3]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#keyword') as HTMLInputElement;

    input.value = 'penthouse';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('0 listings found');
    expect(compiled.textContent).toContain('No listings found.');
  });

  it('clears the keyword filter when clear button is clicked', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2, sampleListing3]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#keyword') as HTMLInputElement;

    input.value = 'garden';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.textContent).toContain('1 listings found');

    const clearButton = input.parentElement?.querySelector('.clear-btn') as HTMLButtonElement;
    expect(clearButton).toBeTruthy();
    clearButton.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('3 listings found');
    expect(compiled.textContent).toContain('123 Main Street');
    expect(input.value).toBe('');
  });

  it('filters listings combining city and keyword description', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2, sampleListing3]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cityInput = compiled.querySelector('#city') as HTMLInputElement;
    const keywordInput = compiled.querySelector('#keyword') as HTMLInputElement;

    cityInput.value = 'Boston';
    cityInput.dispatchEvent(new Event('input'));

    keywordInput.value = 'historic';
    keywordInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    expect(compiled.textContent).toContain('1 listings found');
    expect(compiled.textContent).toContain('45 Beacon Street');
    expect(compiled.textContent).not.toContain('123 Main Street');
    expect(compiled.textContent).not.toContain('10 Oak Avenue');
  });

  it('renders the targetBudget input control', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const label = compiled.querySelector('label[for="targetBudget"]');
    const input = compiled.querySelector('#targetBudget') as HTMLInputElement;

    expect(label?.textContent).toContain('Target Budget');
    expect(input).toBeTruthy();
  });

  it('does not display Score column when targetBudget is empty', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const thead = compiled.querySelector('thead');
    expect(thead?.textContent).not.toContain('Score');
    expect(compiled.querySelector('.score')).toBeNull();
  });

  it('displays Score column and calculated scores when targetBudget is entered', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2, sampleListing3]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#targetBudget') as HTMLInputElement;

    input.value = '650000';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const thead = compiled.querySelector('thead');
    expect(thead?.textContent).toContain('Score');

    const scoreElements = compiled.querySelectorAll('.score');
    expect(scoreElements.length).toBe(3);
    // Listing matching targetBudget (650,000) should have high score
    expect(scoreElements[0].textContent).toContain('%');
  });

  it('clears targetBudget and hides Score column when clear button is clicked', () => {
    mockListingsService.getListings.mockReturnValue(
      of([sampleListing, sampleListing2]),
    );

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#targetBudget') as HTMLInputElement;

    input.value = '500000';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.querySelector('thead')?.textContent).toContain('Score');

    const clearButton = input.parentElement?.querySelector('.clear-btn') as HTMLButtonElement;
    expect(clearButton).toBeTruthy();
    clearButton.click();
    fixture.detectChanges();

    expect(compiled.querySelector('thead')?.textContent).not.toContain('Score');
    expect(input.value).toBe('');
  });

  it('renders pagination controls and items per page dropdown with 5, 10, 50 options', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector('#pageSize') as HTMLSelectElement;
    expect(select).toBeTruthy();

    const options = Array.from(select.options).map((o) => Number(o.value));
    expect(options).toEqual([5, 10, 50]);

    const prevButton = compiled.querySelector('.prev-btn') as HTMLButtonElement;
    const nextButton = compiled.querySelector('.next-btn') as HTMLButtonElement;
    expect(prevButton).toBeTruthy();
    expect(nextButton).toBeTruthy();
    expect(prevButton.disabled).toBe(true);
  });

  it('sends page and pageSize parameters when requesting listings', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(mockListingsService.getListings).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      1,
      10,
    );
  });

  it('updates page size and requests listings with new pageSize', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('#pageSize') as HTMLSelectElement;
    select.value = '5';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(mockListingsService.getListings).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      1,
      5,
    );
  });

  it('navigates to next page and requests listings with new page', () => {
    // Provide 6 listings so with pageSize 5 there are 2 pages
    const sixListings: Listing[] = Array.from({ length: 6 }, (_, i) => ({
      ...sampleListing,
      id: `id-${i}`,
      address: `Address ${i}`,
    }));
    mockListingsService.getListings.mockReturnValue(of(sixListings));

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('#pageSize') as HTMLSelectElement;
    select.value = '5';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const nextBtn = fixture.nativeElement.querySelector('.next-btn') as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(false);

    nextBtn.click();
    fixture.detectChanges();

    expect(mockListingsService.getListings).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      2,
      5,
    );
  });
});
