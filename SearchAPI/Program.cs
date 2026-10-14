
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SearchAPI.Data;
using SearchAPI.Models;

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
// Optional filters: source, city, status, q
app.MapGet("/api/listings", async (
    ListingsDbContext db,
    string? source,
    string? city,
    string? status,
    string? q) =>
{
    var listings = await db.Listings
        .AsNoTracking()
        .ToListAsync();

    var results = listings.AsEnumerable();

    if (!string.IsNullOrWhiteSpace(source))
    {
        results = results.Where(x =>
            string.Equals(x.Source, source,
                StringComparison.OrdinalIgnoreCase));
    }

    if (!string.IsNullOrWhiteSpace(city))
    {
        results = results.Where(x =>
            x.City.Contains(city,
                StringComparison.OrdinalIgnoreCase));
    }

    if (!string.IsNullOrWhiteSpace(status))
    {
        results = results.Where(x =>
            string.Equals(x.Status, status,
                StringComparison.OrdinalIgnoreCase));
    }

    if (!string.IsNullOrWhiteSpace(q))
    {
        results = results.Where(x =>
            x.Address.Contains(q, StringComparison.OrdinalIgnoreCase) ||
            x.City.Contains(q, StringComparison.OrdinalIgnoreCase) ||
            x.State.Contains(q, StringComparison.OrdinalIgnoreCase) ||
            x.Zip.Contains(q, StringComparison.OrdinalIgnoreCase) ||
            x.Description.Contains(q, StringComparison.OrdinalIgnoreCase));
    }

    return Results.Ok(results.ToList());
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
