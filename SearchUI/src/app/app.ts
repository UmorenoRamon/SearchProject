
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

  protected readonly filteredListings = computed(() => {
    const min = this.minPrice();
    const all = this.listings();
    if (min === null || min === undefined) {
      return all;
    }
    return all.filter((listing) => listing.price >= min);
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
}
