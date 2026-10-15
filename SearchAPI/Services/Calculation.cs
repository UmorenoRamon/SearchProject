
using SearchAPI.Models;

namespace SearchAPI.Services;

/// <summary>
/// Provides scoring calculations for listing search results.
/// 
/// Scoring design:
/// - 50% of the score is based on the absolute difference between the farthest value
///   (either the lowest or highest priced property), with the farthest limit valued as 0.
///   If the price is equal to targetBudget, it receives 100% of the 50% part (50 points).
///   When targetBudget is between upper and lower prices of the list, a listing equal to targetBudget receives 50%.
/// - 50% of the score is based on the date, where the oldest listing in the list receives 0% (0 points)
///   and a listing of today receives 100% of the date's 50% part (50 points).
/// - Total score = Price score (0-50) + Date score (0-50) => 0 to 100%.
/// </summary>
public sealed class Calculation
{
    public static readonly Calculation Default = new();

    /// <summary>
    /// Calculates the price score component (0 to 50 points).
    /// </summary>
    public double CalculatePriceScore(decimal price, decimal targetBudget, decimal minPrice, decimal maxPrice)
    {
        decimal diffToMin = Math.Abs(targetBudget - minPrice);
        decimal diffToMax = Math.Abs(targetBudget - maxPrice);
        decimal farthestDiff = Math.Max(diffToMin, diffToMax);

        if (farthestDiff == 0m)
        {
            return price == targetBudget ? 50.0 : 0.0;
        }

        decimal diff = Math.Abs(price - targetBudget);
        double ratio = Math.Max(0.0, 1.0 - (double)(diff / farthestDiff));
        return 50.0 * ratio;
    }

    /// <summary>
    /// Calculates the date score component (0 to 50 points).
    /// </summary>
    public double CalculateDateScore(DateOnly listedDate, DateOnly oldestDate, DateOnly? todayDate = null)
    {
        DateOnly today = todayDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        int totalSpan = today.DayNumber - oldestDate.DayNumber;

        if (totalSpan <= 0)
        {
            return 50.0;
        }

        int elapsed = listedDate.DayNumber - oldestDate.DayNumber;
        double ratio = Math.Clamp((double)elapsed / totalSpan, 0.0, 1.0);
        return 50.0 * ratio;
    }

    /// <summary>
    /// Calculates the total score (0 to 100) for a single listing given the list context.
    /// </summary>
    public double CalculateScore(
        Listing listing,
        decimal targetBudget,
        IEnumerable<Listing> listings,
        DateOnly? todayDate = null)
    {
        var list = listings as IList<Listing> ?? listings.ToList();
        if (list.Count == 0) return 0.0;

        decimal minPrice = list.Min(x => x.Price);
        decimal maxPrice = list.Max(x => x.Price);
        DateOnly oldestDate = list.Min(x => x.ListedDate);

        double priceScore = CalculatePriceScore(listing.Price, targetBudget, minPrice, maxPrice);
        double dateScore = CalculateDateScore(listing.ListedDate, oldestDate, todayDate);

        return Math.Clamp(priceScore + dateScore, 0.0, 100.0);
    }

    /// <summary>
    /// Calculates scores for all listings in the list and returns a dictionary keyed by $"{Source}-{Id}".
    /// </summary>
    public Dictionary<string, double> CalculateScores(
        IEnumerable<Listing> listings,
        decimal targetBudget,
        DateOnly? todayDate = null)
    {
        var list = listings as IList<Listing> ?? listings.ToList();
        var scores = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);

        if (list.Count == 0) return scores;

        decimal minPrice = list.Min(x => x.Price);
        decimal maxPrice = list.Max(x => x.Price);
        DateOnly oldestDate = list.Min(x => x.ListedDate);

        foreach (var item in list)
        {
            double priceScore = CalculatePriceScore(item.Price, targetBudget, minPrice, maxPrice);
            double dateScore = CalculateDateScore(item.ListedDate, oldestDate, todayDate);
            double total = Math.Clamp(priceScore + dateScore, 0.0, 100.0);
            scores[$"{item.Source}-{item.Id}"] = total;
        }

        return scores;
    }

    // Static convenience methods
    public static double ComputePriceScore(decimal price, decimal targetBudget, decimal minPrice, decimal maxPrice)
        => Default.CalculatePriceScore(price, targetBudget, minPrice, maxPrice);

    public static double ComputeDateScore(DateOnly listedDate, DateOnly oldestDate, DateOnly? todayDate = null)
        => Default.CalculateDateScore(listedDate, oldestDate, todayDate);

    public static double ComputeScore(
        Listing listing,
        decimal targetBudget,
        IEnumerable<Listing> listings,
        DateOnly? todayDate = null)
        => Default.CalculateScore(listing, targetBudget, listings, todayDate);

    public static Dictionary<string, double> ComputeScores(
        IEnumerable<Listing> listings,
        decimal targetBudget,
        DateOnly? todayDate = null)
        => Default.CalculateScores(listings, targetBudget, todayDate);
}
