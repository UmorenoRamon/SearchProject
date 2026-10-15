
using SearchAPI.Models;
using SearchAPI.Services;

namespace SearchAPI.Tests;

public class CalculationTests
{
    private readonly Calculation _calculation = new();

    [Fact]
    public void CalculatePriceScore_WhenPriceEqualsTargetBudget_Returns50()
    {
        // 100% of the 50% corresponding part = 50.0
        double score = _calculation.CalculatePriceScore(600000m, 600000m, 400000m, 800000m);
        Assert.Equal(50.0, score);
    }

    [Fact]
    public void CalculatePriceScore_WhenPriceIsAtFarthestLimit_Returns0()
    {
        // min 400k, max 800k, target 600k => farthest distance is 200k
        double scoreMin = _calculation.CalculatePriceScore(400000m, 600000m, 400000m, 800000m);
        double scoreMax = _calculation.CalculatePriceScore(800000m, 600000m, 400000m, 800000m);

        Assert.Equal(0.0, scoreMin);
        Assert.Equal(0.0, scoreMax);
    }

    [Fact]
    public void CalculatePriceScore_WhenTargetBudgetIsBetweenUpperAndLower_BudgetListingReceives50Percent()
    {
        // "When targetBudget is between upper and lower prices of the list, then the budget will be 50%."
        double score = _calculation.CalculatePriceScore(700000m, 700000m, 500000m, 900000m);
        Assert.Equal(50.0, score);
    }

    [Fact]
    public void CalculatePriceScore_AsymmetricRange_CalculatesCorrectly()
    {
        // min 500k, max 900k, target 600k => diffToMin = 100k, diffToMax = 300k => farthestDiff = 300k
        // 900k is the farthest limit => 0
        double scoreFarthest = _calculation.CalculatePriceScore(900000m, 600000m, 500000m, 900000m);
        Assert.Equal(0.0, scoreFarthest);

        // 500k has diff 100k => ratio = 1 - 100/300 = 2/3 => 50 * (2/3) = 33.333...
        double scoreClosest = _calculation.CalculatePriceScore(500000m, 600000m, 500000m, 900000m);
        Assert.Equal(33.333, scoreClosest, precision: 3);
    }

    [Fact]
    public void CalculatePriceScore_SinglePriceListMatchingBudget_Returns50()
    {
        double score = _calculation.CalculatePriceScore(500000m, 500000m, 500000m, 500000m);
        Assert.Equal(50.0, score);
    }

    [Fact]
    public void CalculateDateScore_WhenOldestListing_Returns0()
    {
        var oldest = new DateOnly(2026, 8, 1);
        var today = new DateOnly(2026, 10, 1);

        double score = _calculation.CalculateDateScore(oldest, oldest, today);
        Assert.Equal(0.0, score);
    }

    [Fact]
    public void CalculateDateScore_WhenListingIsToday_Returns50()
    {
        var oldest = new DateOnly(2026, 8, 1);
        var today = new DateOnly(2026, 10, 1);

        // Listing of today gets 100% of the date's 50% part = 50.0
        double score = _calculation.CalculateDateScore(today, oldest, today);
        Assert.Equal(50.0, score);
    }

    [Fact]
    public void CalculateDateScore_InterpolatesMidDateCorrectly()
    {
        var oldest = new DateOnly(2026, 8, 1);
        var today = new DateOnly(2026, 8, 31); // 30 days span
        var midDate = new DateOnly(2026, 8, 16); // 15 days elapsed => exactly 50% of span

        double score = _calculation.CalculateDateScore(midDate, oldest, today);
        Assert.Equal(25.0, score, precision: 2);
    }

    [Fact]
    public void CalculateScore_PerfectMatch_Returns100()
    {
        var today = new DateOnly(2026, 10, 15);
        var listings = new List<Listing>
        {
            new()
            {
                Id = "1",
                Source = "A",
                Address = "123 Main St",
                City = "Boston",
                State = "MA",
                Zip = "02110",
                Price = 600000m,
                Bedrooms = 3,
                Bathrooms = 2,
                Sqft = 1500,
                Status = "active",
                Description = "Match",
                ListedDate = today
            },
            new()
            {
                Id = "2",
                Source = "A",
                Address = "456 Elm St",
                City = "Boston",
                State = "MA",
                Zip = "02110",
                Price = 800000m,
                Bedrooms = 4,
                Bathrooms = 3,
                Sqft = 2000,
                Status = "active",
                Description = "Other",
                ListedDate = new DateOnly(2026, 8, 15)
            },
            new()
            {
                Id = "3",
                Source = "A",
                Address = "789 Pine St",
                City = "Boston",
                State = "MA",
                Zip = "02110",
                Price = 400000m,
                Bedrooms = 2,
                Bathrooms = 1,
                Sqft = 1000,
                Status = "active",
                Description = "Other",
                ListedDate = new DateOnly(2026, 9, 15)
            }
        };

        // Listing 1 matches targetBudget 600k (50 pts) and is listed today (50 pts) => 100%
        double score = _calculation.CalculateScore(listings[0], 600000m, listings, today);
        Assert.Equal(100.0, score);
    }

    [Fact]
    public void CalculateScore_WorstMatch_Returns0()
    {
        var today = new DateOnly(2026, 10, 15);
        var listings = new List<Listing>
        {
            new()
            {
                Id = "1",
                Source = "A",
                Address = "123 Main St",
                City = "Boston",
                State = "MA",
                Zip = "02110",
                Price = 600000m,
                Bedrooms = 3,
                Bathrooms = 2,
                Sqft = 1500,
                Status = "active",
                Description = "Match",
                ListedDate = today
            },
            new()
            {
                Id = "2",
                Source = "A",
                Address = "456 Elm St",
                City = "Boston",
                State = "MA",
                Zip = "02110",
                Price = 800000m,
                Bedrooms = 4,
                Bathrooms = 3,
                Sqft = 2000,
                Status = "active",
                Description = "Other",
                ListedDate = new DateOnly(2026, 8, 15)
            }
        };

        // Listing 2 is farthest (diff = 200k, 0 pts) and oldest (0 pts) => 0%
        double score = _calculation.CalculateScore(listings[1], 600000m, listings, today);
        Assert.Equal(0.0, score);
    }

    [Fact]
    public void CalculateScores_CalculatesAllListingsCorrectly()
    {
        var today = new DateOnly(2026, 10, 15);
        var listings = new List<Listing>
        {
            new()
            {
                Id = "101",
                Source = "MLS_A",
                Address = "123 Main St",
                City = "Boston",
                State = "MA",
                Zip = "02110",
                Price = 600000m,
                Bedrooms = 3,
                Bathrooms = 2,
                Sqft = 1500,
                Status = "active",
                Description = "Match",
                ListedDate = today
            },
            new()
            {
                Id = "102",
                Source = "MLS_B",
                Address = "456 Elm St",
                City = "Boston",
                State = "MA",
                Zip = "02110",
                Price = 800000m,
                Bedrooms = 4,
                Bathrooms = 3,
                Sqft = 2000,
                Status = "active",
                Description = "Other",
                ListedDate = new DateOnly(2026, 8, 15)
            }
        };

        var scores = _calculation.CalculateScores(listings, 600000m, today);

        Assert.Equal(2, scores.Count);
        Assert.Equal(100.0, scores["MLS_A-101"]);
        Assert.Equal(0.0, scores["MLS_B-102"]);
    }
}
