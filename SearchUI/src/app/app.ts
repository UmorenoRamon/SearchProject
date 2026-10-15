
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { Listing } from './models/listing';
import { ListingsService } from './services/listings.service';
import { calculateListingScores } from './calculation';

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
  protected readonly targetBudget = signal<number | null>(null);
  protected readonly pageSize = signal<number>(10);
  protected readonly currentPage = signal<number>(1);
  protected readonly pageSizeOptions = [5, 10, 50];

  protected readonly totalPages = computed(() => {
    const total = this.filteredListings().length;
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  protected readonly paginatedListings = computed(() => {
    const filtered = this.filteredListings();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return filtered.slice(start, start + size);
  });

  protected readonly listingScores = computed(() => {
    const budget = this.targetBudget();
    const currentListings = this.filteredListings();
    if (budget === null || budget === undefined || currentListings.length === 0) {
      return new Map<string, number>();
    }
    return calculateListingScores(currentListings, budget);
  });

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
    this.loadListings();
  }

  protected loadListings(): void {
    this.loading.set(true);
    this.listingsService
      .getListings(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        this.currentPage(),
        this.pageSize(),
      )
      .subscribe({
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

  protected updateTargetBudget(value: string): void {
    const trimmed = value.trim();
    if (trimmed === '') {
      this.targetBudget.set(null);
      return;
    }
    const parsed = Number(trimmed);
    this.targetBudget.set(!isNaN(parsed) && parsed >= 0 ? parsed : null);
  }

  protected clearTargetBudget(): void {
    this.targetBudget.set(null);
  }

  protected getScore(listing: Listing): number | null {
    if (this.targetBudget() === null) return null;
    const key = `${listing.source}-${listing.id}`;
    return this.listingScores().get(key) ?? null;
  }

  protected getScoreDisplay(listing: Listing): string {
    const score = this.getScore(listing);
    if (score === null) return '-';
    return `${Math.round(score)}%`;
  }

  protected goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadListings();
    }
  }

  protected updatePageSize(value: string | number): void {
    const size = Number(value);
    if (!isNaN(size) && size > 0 && size !== this.pageSize()) {
      this.pageSize.set(size);
      this.currentPage.set(1);
      this.loadListings();
    }
  }
}
