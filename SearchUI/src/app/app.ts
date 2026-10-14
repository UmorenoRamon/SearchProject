
import { Component, OnInit, signal, inject } from '@angular/core';
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
}
