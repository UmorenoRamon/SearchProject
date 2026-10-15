
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { Listing } from './models/listing';
import { ListingsService } from './services/listings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly listingsService = inject(ListingsService);

  protected readonly title = signal('Real Estate Listings');
  protected readonly listings = signal<Listing[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly minPrice = signal<number | null>(null);
  protected readonly maxPrice = signal<number | null>(null);
  protected readonly minBedrooms = signal<number | null>(null);
  protected readonly city = signal<string>('');
  protected readonly keyword = signal<string>('');

  protected readonly filteredListings = computed(() => {
    const minP = this.minPrice();
    const maxP = this.maxPrice();
    const minB = this.minBedrooms();
    const c = this.city().trim().toLowerCase();
    const kw = this.keyword().trim().toLowerCase();
    let result = this.listings();

    if (minP !== null && minP !== undefined) {
      result = result.filter((listing) => listing.price >= minP);
    }
    if (maxP !== null && maxP !== undefined) {
      result = result.filter((listing) => listing.price <= maxP);
    }
    if (minB !== null && minB !== undefined) {
      result = result.filter((listing) => listing.bedrooms >= minB);
    }
    if (c !== '') {
      result = result.filter((listing) =>
        listing.city.toLowerCase().includes(c)
      );
    }
    if (kw !== '') {
      result = result.filter((listing) =>
        listing.description.toLowerCase().includes(kw)
      );
    }
    return result;
  });

  ngOnInit(): void {
    this.listingsService.getListings().subscribe({
      next: (data) => {
        this.listings.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load listings:', err);
        this.error.set(
          'Unable to load listings. Check that the API is running.'
        );
        this.loading.set(false);
      },
    });
  }

  protected updateMinPrice(value: string): void {
    const trimmed = value.trim();
    if (trimmed === '') {
      this.minPrice.set(null);
      return;
    }
    const parsed = Number(trimmed);
    this.minPrice.set(!isNaN(parsed) && parsed >= 0 ? parsed : null);
  }

  protected clearMinPrice(): void {
    this.minPrice.set(null);
  }

  protected updateMaxPrice(value: string): void {
    const trimmed = value.trim();
    if (trimmed === '') {
      this.maxPrice.set(null);
      return;
    }
    const parsed = Number(trimmed);
    this.maxPrice.set(!isNaN(parsed) && parsed >= 0 ? parsed : null);
  }

  protected clearMaxPrice(): void {
    this.maxPrice.set(null);
  }

  protected updateMinBedrooms(value: string): void {
    const trimmed = value.trim();
    if (trimmed === '') {
      this.minBedrooms.set(null);
      return;
    }
    const parsed = Number(trimmed);
    this.minBedrooms.set(!isNaN(parsed) && parsed >= 0 ? parsed : null);
  }

  protected clearMinBedrooms(): void {
    this.minBedrooms.set(null);
  }

  protected updateCity(value: string): void {
    this.city.set(value);
  }

  protected clearCity(): void {
    this.city.set('');
  }

  protected updateKeyword(value: string): void {
    this.keyword.set(value);
  }

  protected clearKeyword(): void {
    this.keyword.set('');
  }
}
