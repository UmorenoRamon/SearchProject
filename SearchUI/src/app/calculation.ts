import { Listing } from './models/listing';

/**
 * Parses a date string (YYYY-MM-DD), Date, or timestamp into a UTC midnight timestamp.
 */
export function parseDateToUtc(date: string | Date | number): number {
  if (typeof date === 'number') return date;
  if (date instanceof Date) {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
  const dateStr = String(date).split('T')[0];
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  }
  const d = new Date(date);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Calculates the price score component (up to 50% of the total score).
 *
 * 50% of the score is based on the absolute difference between the farthest value
 * (either the lowest priced property or the highest), being the farthest limit valued as 0.
 * If the price is equal to targetBudget, it receives 100% of the 50% corresponding part (50 points).
 * When targetBudget is between upper and lower prices of the list, a listing equal to targetBudget receives 50%.
 */
export function calculatePriceScore(
  price: number,
  targetBudget: number,
  minPrice: number,
  maxPrice: number,
): number {
  const diffToMin = Math.abs(targetBudget - minPrice);
  const diffToMax = Math.abs(targetBudget - maxPrice);
  const farthestDiff = Math.max(diffToMin, diffToMax);

  if (farthestDiff === 0) {
    return price === targetBudget ? 50 : 0;
  }

  const diff = Math.abs(price - targetBudget);
  const ratio = Math.max(0, 1 - diff / farthestDiff);
  return 50 * ratio;
}

/**
 * Calculates the date score component (up to 50% of the total score).
 *
 * The oldest listing in the list is 0% (0 points), and a listing of today is 100% of the
 * corresponding 50% part (50 points).
 */
export function calculateDateScore(
  listedDate: string | Date | number,
  oldestDate: string | Date | number,
  todayDate: string | Date | number = new Date(),
): number {
  const currentTimestamp = parseDateToUtc(listedDate);
  const oldestTimestamp = parseDateToUtc(oldestDate);
  const todayTimestamp = parseDateToUtc(todayDate);

  const totalSpan = todayTimestamp - oldestTimestamp;
  if (totalSpan <= 0) {
    return 50;
  }

  const elapsed = currentTimestamp - oldestTimestamp;
  const ratio = Math.min(1, Math.max(0, elapsed / totalSpan));
  return 50 * ratio;
}

/**
 * Calculates the total score (0 to 100) for a single listing given the list context.
 */
export function calculateListingScore(
  listing: Listing,
  targetBudget: number,
  listings: Listing[],
  todayDate: string | Date | number = new Date(),
): number {
  if (!listings || listings.length === 0) return 0;

  let minPrice = listings[0].price;
  let maxPrice = listings[0].price;
  let oldestDateTimestamp = parseDateToUtc(listings[0].listedDate);

  for (const item of listings) {
    if (item.price < minPrice) minPrice = item.price;
    if (item.price > maxPrice) maxPrice = item.price;
    const itemDate = parseDateToUtc(item.listedDate);
    if (itemDate < oldestDateTimestamp) {
      oldestDateTimestamp = itemDate;
    }
  }

  const priceScore = calculatePriceScore(listing.price, targetBudget, minPrice, maxPrice);
  const dateScore = calculateDateScore(listing.listedDate, oldestDateTimestamp, todayDate);
  return Math.min(100, Math.max(0, priceScore + dateScore));
}

/**
 * Calculates scores for all listings in the provided list and returns a map keyed by `${source}-${id}`.
 */
export function calculateListingScores(
  listings: Listing[],
  targetBudget: number,
  todayDate: string | Date | number = new Date(),
): Map<string, number> {
  const scores = new Map<string, number>();
  if (!listings || listings.length === 0) return scores;

  let minPrice = listings[0].price;
  let maxPrice = listings[0].price;
  let oldestDateTimestamp = parseDateToUtc(listings[0].listedDate);

  for (const item of listings) {
    if (item.price < minPrice) minPrice = item.price;
    if (item.price > maxPrice) maxPrice = item.price;
    const itemDate = parseDateToUtc(item.listedDate);
    if (itemDate < oldestDateTimestamp) {
      oldestDateTimestamp = itemDate;
    }
  }

  const todayTimestamp = parseDateToUtc(todayDate);

  for (const item of listings) {
    const priceScore = calculatePriceScore(item.price, targetBudget, minPrice, maxPrice);
    const dateScore = calculateDateScore(item.listedDate, oldestDateTimestamp, todayTimestamp);
    const total = Math.min(100, Math.max(0, priceScore + dateScore));
    scores.set(`${item.source}-${item.id}`, total);
  }

  return scores;
}
