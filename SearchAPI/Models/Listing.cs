
namespace SearchAPI.Models;

public sealed class Listing
{
    public required string Id { get; set; }
    public required string Source { get; set; }

    public required string Address { get; set; }
    public required string City { get; set; }
    public required string State { get; set; }
    public required string Zip { get; set; }

    public decimal Price { get; set; }
    public int Bedrooms { get; set; }
    public double Bathrooms { get; set; }
    public int Sqft { get; set; }

    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public DateOnly ListedDate { get; set; }
    public required string Status { get; set; }
    public required string Description { get; set; }
}
