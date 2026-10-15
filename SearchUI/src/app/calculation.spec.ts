import { describe, expect, it } from 'vitest';
import {
  calculatePriceScore,
  calculateDateScore,
  calculateListingScore,
  calculateListingScores,
  parseDateToUtc,
} from './calculation';
import { Listing } from './models/listing';

describe('Scoring calculation', () => {
  describe('calculatePriceScore', () => {
    it('returns 50 (100% of the 50% part) when price is equal to targetBudget', () => {
      // Prices in list: min 400k, max 800k. Target budget = 600k (between upper and lower).
      const score = calculatePriceScore(600000, 600000, 400000, 800000);
      expect(score).toBe(50);
    });

    it('returns 0 for the farthest limit', () => {
      // min 400k, max 800k. Target budget = 600k.
      // |600k - 400k| = 200k, |600k - 800k| = 200k.
      // Both 400k and 800k are the farthest limit and should get 0.
      expect(calculatePriceScore(400000, 600000, 400000, 800000)).toBe(0);
      expect(calculatePriceScore(800000, 600000, 400000, 800000)).toBe(0);
    });

    it('returns 0 for the farthest limit when asymmetric', () => {
      // min 500k, max 900k. Target budget = 600k.
      // diffToMin = 100k, diffToMax = 300k.
      // Farthest limit is 900k (farthestDiff = 300k).
      expect(calculatePriceScore(900000, 600000, 500000, 900000)).toBe(0);

      // Property at 500k: diff = 100k. Ratio = 1 - 100/300 = 2/3. Score = 50 * (2/3) = 33.333...
      const scoreMin = calculatePriceScore(500000, 600000, 500000, 900000);
      expect(scoreMin).toBeCloseTo(33.333, 2);
    });

    it('handles targetBudget between upper and lower prices', () => {
      // User specification: "When targetBudget is between upper and lower prices of the list, then the budget will be 50%."
      const score = calculatePriceScore(700000, 700000, 500000, 900000);
      expect(score).toBe(50);
    });

    it('handles targetBudget outside the range', () => {
      // targetBudget = 300k, min = 500k, max = 900k.
      // diffToMin = 200k, diffToMax = 600k.
      // Farthest is 900k (diff 600k -> score 0).
      expect(calculatePriceScore(900000, 300000, 500000, 900000)).toBe(0);

      // Property at 500k has diff = 200k. Ratio = 1 - 200/600 = 2/3.
      expect(calculatePriceScore(500000, 300000, 500000, 900000)).toBeCloseTo(33.333, 2);
    });

    it('handles single price in list matching targetBudget', () => {
      expect(calculatePriceScore(500000, 500000, 500000, 500000)).toBe(50);
    });

    it('handles single price in list not matching targetBudget', () => {
      expect(calculatePriceScore(500000, 600000, 500000, 500000)).toBe(0);
    });
  });

  describe('calculateDateScore', () => {
    const oldestDate = '2026-08-01';
    const todayDate = '2026-10-01'; // 61 days span

    it('returns 0 for the oldest listing', () => {
      const score = calculateDateScore('2026-08-01', oldestDate, todayDate);
      expect(score).toBe(0);
    });

    it('returns 50 (100% of the date 50% component) for a listing of today', () => {
      const score = calculateDateScore('2026-10-01', oldestDate, todayDate);
      expect(score).toBe(50);
    });

    it('interpolates linearly for intermediate dates', () => {
      const oldestTime = parseDateToUtc(oldestDate);
      const todayTime = parseDateToUtc(todayDate);
      const midTime = oldestTime + (todayTime - oldestTime) / 2;

      const score = calculateDateScore(midTime, oldestDate, todayDate);
      expect(score).toBeCloseTo(25, 2);
    });

    it('returns 50 when oldest listing is today', () => {
      expect(calculateDateScore(todayDate, todayDate, todayDate)).toBe(50);
    });
  });

  describe('calculateListingScores', () => {
    const sampleListings: Listing[] = [
      {
        id: '1001',
        source: 'MLS_A',
        address: '123 Main Street',
        city: 'Boston',
        state: 'MA',
        zip: '02110',
        price: 600000, // matches targetBudget
        bedrooms: 3,
        bathrooms: 2.5,
        sqft: 1800,
        latitude: 42.357,
        longitude: -71.058,
        listedDate: '2026-10-15', // today
        status: 'active',
        description: 'Perfect match',
      },
      {
        id: '1002',
        source: 'MLS_B',
        address: '45 Beacon Street',
        city: 'Boston',
        state: 'MA',
        zip: '02108',
        price: 800000, // farthest limit (|800k - 600k| = 200k, same as |400k - 600k|)
        bedrooms: 4,
        bathrooms: 3.0,
        sqft: 2200,
        latitude: 42.356,
        longitude: -71.065,
        listedDate: '2026-08-15', // oldest
        status: 'pending',
        description: 'Older listing',
      },
      {
        id: '2001',
        source: 'MLS_A',
        address: '10 Oak Avenue',
        city: 'Cambridge',
        state: 'MA',
        zip: '02139',
        price: 400000, // farthest limit
        bedrooms: 2,
        bathrooms: 1.0,
        sqft: 1100,
        latitude: 42.373,
        longitude: -71.109,
        listedDate: '2026-09-15', // middle date
        status: 'sold',
        description: 'Mid date listing',
      },
    ];

    it('gives 100% total score to a property matching targetBudget listed today', () => {
      const scores = calculateListingScores(sampleListings, 600000, '2026-10-15');
      // MLS_A-1001: Price = 600k (match -> 50), Date = 2026-10-15 (today -> 50) => 100%
      expect(scores.get('MLS_A-1001')).toBe(100);
    });

    it('gives 0% total score to the farthest priced property with the oldest date', () => {
      const scores = calculateListingScores(sampleListings, 600000, '2026-10-15');
      // MLS_B-1002: Price = 800k (farthest -> 0), Date = 2026-08-15 (oldest -> 0) => 0%
      expect(scores.get('MLS_B-1002')).toBe(0);
    });

    it('calculates expected score for intermediate listing', () => {
      const scores = calculateListingScores(sampleListings, 600000, '2026-10-15');
      // MLS_A-2001: Price = 400k (farthest -> 0), Date = 2026-09-15 (middle date)
      const score = scores.get('MLS_A-2001');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(50);
    });

    it('returns empty map for empty listings', () => {
      const scores = calculateListingScores([], 600000);
      expect(scores.size).toBe(0);
    });

    it('calculateListingScore matches map result', () => {
      const map = calculateListingScores(sampleListings, 600000, '2026-10-15');
      const single = calculateListingScore(sampleListings[0], 600000, sampleListings, '2026-10-15');
      expect(single).toBe(map.get('MLS_A-1001'));
    });
  });
});
