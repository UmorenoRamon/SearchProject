
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SearchAPI.Data;
using SearchAPI.Models;
using SearchAPI.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddDbContext<ListingsDbContext>(options =>
    options.UseInMemoryDatabase("ListingsDatabase"));

builder.Services.AddScoped<ListingSearchService>();

var app = builder.Build();

app.UseCors();

// Load JSON and seed the in-memory database at startup.
var jsonPath = Path.Combine(
    app.Environment.ContentRootPath,
    "DataFiles",
    "listings.json");

if (!File.Exists(jsonPath))
{
    throw new FileNotFoundException(
        $"Listings JSON file was not found: {jsonPath}");
}

await using (var stream = File.OpenRead(jsonPath))
{
    var listings = await JsonSerializer.DeserializeAsync<List<Listing>>(
        stream,
        new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

    if (listings is null)
    {
        throw new InvalidDataException(
            "The listings JSON file did not contain a valid listing array.");
    }

    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider
        .GetRequiredService<ListingsDbContext>();

    db.Listings.AddRange(listings);
    await db.SaveChangesAsync();
}

// GET /api/listings
// Optional filters: source, city, status, q, minPrice, maxPrice, minBedrooms, description, keyword

app.MapGet("/api/listings", async (
    ListingsDbContext db,
    ListingSearchService searchService,
    string? source,
    string? city,
    string? status,
    string? q,
    decimal? minPrice,
    decimal? maxPrice,
    int? minBedrooms,
    string? description,
    string? keyword) =>
{
    var listings = await db.Listings
        .AsNoTracking()
        .ToListAsync();

    var results = searchService.Search(
        listings,
        source,
        city,
        status,
        q,
        minPrice,
        maxPrice,
        minBedrooms,
        description ?? keyword);

    return Results.Ok(results);
});


// GET /api/listings/{source}/{id}
app.MapGet("/api/listings/{source}/{id}", async (
    string source,
    string id,
    ListingsDbContext db) =>
{
    var listing = await db.Listings
        .AsNoTracking()
        .FirstOrDefaultAsync(x =>
            x.Source == source && x.Id == id);

    return listing is null
        ? Results.NotFound()
        : Results.Ok(listing);
});

app.Run();
