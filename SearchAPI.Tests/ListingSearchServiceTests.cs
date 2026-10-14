
using SearchAPI.Models;
using SearchAPI.Services;

namespace SearchAPI.Tests;

public class ListingSearchServiceTests
{
    private readonly ListingSearchService _service = new();

    private static List<Listing> CreateListings() =>
    [
        new()
        {
            Id = "1001",
            Source = "MLS_A",
            Address = "123 Main Street",
            City = "Boston",
            State = "MA",
            Zip = "02110",
            Price = 650000m,
            Bedrooms = 3,
            Bathrooms = 2.5,
            Sqft = 1800,
            Latitude = 42.357,
            Longitude = -71.058,
            ListedDate = new DateOnly(2026, 9, 15),
            Status = "active",
            Description = "Updated kitchen near downtown"
        },
        new()
        {
            Id = "1001",
            Source = "MLS_B",
            Address = "45 Beacon Street",
            City = "Boston",
            State = "MA",
            Zip = "02108",
            Price = 825000m,
            Bedrooms = 4,
            Bathrooms = 3.0,
            Sqft = 2200,
            Latitude = 42.356,
            Longitude = -71.065,
            ListedDate = new DateOnly(2026, 9, 20),
            Status = "pending",
            Description = "Historic property"
        },
        new()
        {
            Id = "2001",
            Source = "MLS_A",
            Address = "10 Oak Avenue",
            City = "Cambridge",
            State = "MA",
            Zip = "02139",
            Price = 500000m,
            Bedrooms = 2,
            Bathrooms = 1.0,
            Sqft = 1100,
            Latitude = 42.373,
            Longitude = -71.109,
            ListedDate = new DateOnly(2026, 9, 22),
            Status = "sold",
            Description = "Cozy home with garden"
        }
    ];

    [Fact]
    public void Search_BySource_IsCaseInsensitive()
    {
        var results = _service.Search(
            CreateListings(), source: "mls_a");

        Assert.Equal(2, results.Count);
        Assert.All(results, x => Assert.Equal("MLS_A", x.Source));
    }

    [Fact]
    public void Search_ByDescription_IsCaseInsensitive()
    {
        var results = _service.Search(
            CreateListings(), q: "KITCHEN");

        var listing = Assert.Single(results);
        Assert.Equal("1001", listing.Id);
        Assert.Equal("MLS_A", listing.Source);
    }

    [Fact]
    public void Search_WithMultipleFilters_AppliesAllFilters()
    {
        var results = _service.Search(
            CreateListings(),
            city: "Boston",
            status: "active");

        var listing = Assert.Single(results);
        Assert.Equal("1001", listing.Id);
        Assert.Equal("MLS_A", listing.Source);
    }

    [Fact]
    public void Search_WithNoFilters_ReturnsAllListings()
    {
        var results = _service.Search(CreateListings());

        Assert.Equal(3, results.Count);
    }

    [Fact]
    public void Search_WithNoMatches_ReturnsEmptyList()
    {
        var results = _service.Search(
            CreateListings(), city: "Chicago");

        Assert.Empty(results);
    }
}
