
import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';

import { Listing } from './models/listing';
import { ListingsService } from './services/listings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  private readonly listingsService = inject(ListingsService);
  private listingsSubscription?: Subscription;

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

  ngOnDestroy(): void {
    this.listingsSubscription?.unsubscribe();
  }

  protected loadListings(): void {
    const focusedElement =
      typeof document !== 'undefined'
        ? (document.activeElement as HTMLElement | null)
        : null;
    const focusedId = focusedElement?.id;
    let selStart: number | null = null;
    let selEnd: number | null = null;
    if (focusedElement instanceof HTMLInputElement) {
      try {
        selStart = focusedElement.selectionStart;
        selEnd = focusedElement.selectionEnd;
      } catch {
        // Ignored for input types that do not support selection
      }
    }

    this.loading.set(true);
    this.error.set('');
    this.listingsSubscription?.unsubscribe();
    this.listingsSubscription = this.listingsService
      .getListings(
        this.minPrice() ?? undefined,
        this.maxPrice() ?? undefined,
        this.minBedrooms() ?? undefined,
        this.city().trim() || undefined,
        this.keyword().trim() || undefined,
        this.currentPage(),
        this.pageSize(),
        this.targetBudget() ?? undefined,
      )
      .subscribe({
        next: (data) => {
          this.listings.set(data);
          this.loading.set(false);
          this.restoreFocus(focusedId, selStart, selEnd);
        },
        error: (err) => {
          console.error('Failed to load listings:', err);
          this.error.set(
            'Unable to load listings. Check that the API is running.'
          );
          this.loading.set(false);
          this.restoreFocus(focusedId, selStart, selEnd);
        },
      });
  }

  private restoreFocus(
    id?: string,
    start?: number | null,
    end?: number | null
  ): void {
    if (!id || typeof document === 'undefined') return;
    queueMicrotask(() => {
      const target = document.getElementById(id) as HTMLInputElement | null;
      if (target) {
        if (
          document.activeElement !== target &&
          (document.activeElement === document.body ||
            document.activeElement === null)
        ) {
          target.focus();
        }
        if (
          start !== null &&
          start !== undefined &&
          end !== null &&
          end !== undefined &&
          (target.type === 'text' || target.type === 'search')
        ) {
          try {
            target.setSelectionRange(start, end);
          } catch {
            // Ignore
          }
        }
      }
    });
  }

  protected updateMinPrice(value: string): void {
    const trimmed = value.trim();
    if (trimmed === '') {
      if (this.minPrice() !== null) {
        this.minPrice.set(null);
        this.currentPage.set(1);
        this.loadListings();
      }
      return;
    }
    const parsed = Number(trimmed);
    const newMin = !isNaN(parsed) && parsed >= 0 ? parsed : null;
    if (newMin !== this.minPrice()) {
      this.minPrice.set(newMin);
      this.currentPage.set(1);
      this.loadListings();
    }
  }

  protected clearMinPrice(): void {
    if (this.minPrice() !== null) {
      this.minPrice.set(null);
      this.currentPage.set(1);
      this.loadListings();
    }
  }

  protected updateMaxPrice(value: string): void {
    const trimmed = value.trim();
    if (trimmed === '') {
      if (this.maxPrice() !== null) {
        this.maxPrice.set(null);
        this.currentPage.set(1);
        this.loadListings();
      }
      return;
    }
    const parsed = Number(trimmed);
    const newMax = !isNaN(parsed) && parsed >= 0 ? parsed : null;
    if (newMax !== this.maxPrice()) {
      this.maxPrice.set(newMax);
      this.currentPage.set(1);
      this.loadListings();
    }
  }

  protected clearMaxPrice(): void {
    if (this.maxPrice() !== null) {
      this.maxPrice.set(null);
      this.currentPage.set(1);
      this.loadListings();
    }
  }

  protected updateMinBedrooms(value: string): void {
    const trimmed = value.trim();
    if (trimmed === '') {
      if (this.minBedrooms() !== null) {
        this.minBedrooms.set(null);
        this.currentPage.set(1);
        this.loadListings();
      }
      return;
    }
    const parsed = Number(trimmed);
    const newMin = !isNaN(parsed) && parsed >= 0 ? parsed : null;
    if (newMin !== this.minBedrooms()) {
      this.minBedrooms.set(newMin);
      this.currentPage.set(1);
      this.loadListings();
    }
  }

  protected clearMinBedrooms(): void {
    if (this.minBedrooms() !== null) {
      this.minBedrooms.set(null);
      this.currentPage.set(1);
      this.loadListings();
    }
  }

  protected updateCity(value: string): void {
    if (value !== this.city()) {
      this.city.set(value);
      this.currentPage.set(1);
      this.loadListings();
    }
  }

  protected clearCity(): void {
    if (this.city() !== '') {
      this.city.set('');
      this.currentPage.set(1);
      this.loadListings();
    }
  }

  protected updateKeyword(value: string): void {
    if (value !== this.keyword()) {
      this.keyword.set(value);
      this.currentPage.set(1);
      this.loadListings();
    }
  }

  protected clearKeyword(): void {
    if (this.keyword() !== '') {
      this.keyword.set('');
      this.currentPage.set(1);
      this.loadListings();
    }
  }

  protected updateTargetBudget(value: string): void {
    const trimmed = value.trim();
    if (trimmed === '') {
      if (this.targetBudget() !== null) {
        this.targetBudget.set(null);
        this.currentPage.set(1);
        this.loadListings();
      }
      return;
    }
    const parsed = Number(trimmed);
    const newBudget = !isNaN(parsed) && parsed >= 0 ? parsed : null;
    if (newBudget !== this.targetBudget()) {
      this.targetBudget.set(newBudget);
      this.currentPage.set(1);
      this.loadListings();
    }
  }

  protected clearTargetBudget(): void {
    if (this.targetBudget() !== null) {
      this.targetBudget.set(null);
      this.currentPage.set(1);
      this.loadListings();
    }
  }

  protected getScore(listing: Listing): number | null {
    if (this.targetBudget() === null || listing.score === null || listing.score === undefined) {
      return null;
    }
    return listing.score;
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
