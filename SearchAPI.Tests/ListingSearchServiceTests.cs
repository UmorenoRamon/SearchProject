
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

    [Fact]
    public void Search_ByMinPrice_FiltersCorrectly()
    {
        var results = _service.Search(
            CreateListings(), minPrice: 650000m);

        Assert.Equal(2, results.Count);
        Assert.All(results, x => Assert.True(x.Price >= 650000m));
    }

    [Fact]
    public void Search_ByMinPrice_WhenExceedsAll_ReturnsEmpty()
    {
        var results = _service.Search(
            CreateListings(), minPrice: 1000000m);

        Assert.Empty(results);
    }

    [Fact]
    public void Search_ByMaxPrice_FiltersCorrectly()
    {
        var results = _service.Search(
            CreateListings(), maxPrice: 650000m);

        Assert.Equal(2, results.Count);
        Assert.All(results, x => Assert.True(x.Price <= 650000m));
    }

    [Fact]
    public void Search_ByMaxPrice_WhenBelowAll_ReturnsEmpty()
    {
        var results = _service.Search(
            CreateListings(), maxPrice: 400000m);

        Assert.Empty(results);
    }

    [Fact]
    public void Search_ByMinBedrooms_FiltersCorrectly()
    {
        var results = _service.Search(
            CreateListings(), minBedrooms: 3);

        Assert.Equal(2, results.Count);
        Assert.All(results, x => Assert.True(x.Bedrooms >= 3));
    }

    [Fact]
    public void Search_ByMinBedrooms_WhenExceedsAll_ReturnsEmpty()
    {
        var results = _service.Search(
            CreateListings(), minBedrooms: 5);

        Assert.Empty(results);
    }

    [Fact]
    public void Search_ByPriceRangeAndBedrooms_FiltersCorrectly()
    {
        var results = _service.Search(
            CreateListings(),
            minPrice: 500000m,
            maxPrice: 700000m,
            minBedrooms: 3);

        var listing = Assert.Single(results);
        Assert.Equal("1001", listing.Id);
        Assert.Equal("MLS_A", listing.Source);
        Assert.Equal(650000m, listing.Price);
        Assert.Equal(3, listing.Bedrooms);
    }

    [Fact]
    public void Search_ByCity_FiltersCorrectly()
    {
        var results = _service.Search(
            CreateListings(), city: "Cambridge");

        var listing = Assert.Single(results);
        Assert.Equal("2001", listing.Id);
        Assert.Equal("Cambridge", listing.City);
    }

    [Fact]
    public void Search_ByCity_IsCaseInsensitive()
    {
        var results = _service.Search(
            CreateListings(), city: "boston");

        Assert.Equal(2, results.Count);
        Assert.All(results, x => Assert.Equal("Boston", x.City));
    }

    [Fact]
    public void Search_ByDescriptionField_FiltersCorrectly()
    {
        var results = _service.Search(
            CreateListings(), description: "kitchen");

        var listing = Assert.Single(results);
        Assert.Equal("1001", listing.Id);
        Assert.Contains("kitchen", listing.Description, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Search_ByDescriptionField_IsCaseInsensitive()
    {
        var results = _service.Search(
            CreateListings(), description: "GARDEN");

        var listing = Assert.Single(results);
        Assert.Equal("2001", listing.Id);
        Assert.Contains("garden", listing.Description, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Search_ByCityAndDescription_FiltersCorrectly()
    {
        var results = _service.Search(
            CreateListings(),
            city: "Boston",
            description: "Historic");

        var listing = Assert.Single(results);
        Assert.Equal("1001", listing.Id);
        Assert.Equal("MLS_B", listing.Source);
    }

    [Fact]
    public void Search_WithPagination_ReturnsFirstPage()
    {
        var results = _service.Search(
            CreateListings(), page: 1, pageSize: 2);

        Assert.Equal(2, results.Count);
        Assert.Equal("1001", results[0].Id);
        Assert.Equal("MLS_A", results[0].Source);
        Assert.Equal("1001", results[1].Id);
        Assert.Equal("MLS_B", results[1].Source);
    }

    [Fact]
    public void Search_WithPagination_ReturnsSecondPage()
    {
        var results = _service.Search(
            CreateListings(), page: 2, pageSize: 2);

        var listing = Assert.Single(results);
        Assert.Equal("2001", listing.Id);
        Assert.Equal("MLS_A", listing.Source);
    }

    [Fact]
    public void Search_WithPagination_ReturnsEmptyWhenPageExceedsResults()
    {
        var results = _service.Search(
            CreateListings(), page: 3, pageSize: 2);

        Assert.Empty(results);
    }

    [Fact]
    public void Search_WithPageSizeOnly_DefaultsToPageOne()
    {
        var results = _service.Search(
            CreateListings(), pageSize: 1);

        var listing = Assert.Single(results);
        Assert.Equal("1001", listing.Id);
        Assert.Equal("MLS_A", listing.Source);
    }
}
