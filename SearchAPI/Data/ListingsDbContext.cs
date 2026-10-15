
using Microsoft.EntityFrameworkCore;
using SearchAPI.Models;

namespace SearchAPI.Data;

public sealed class ListingsDbContext(
    DbContextOptions<ListingsDbContext> options)
    : DbContext(options)
{
    public DbSet<Listing> Listings => Set<Listing>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var listing = modelBuilder.Entity<Listing>();

        listing.HasKey(x => new { x.Source, x.Id });

        listing.Property(x => x.Price)
            .HasPrecision(18, 2);

        listing.Property(x => x.Description)
            .IsRequired();

        listing.Property(x => x.Status)
            .IsRequired();

        listing.Ignore(x => x.Score);
    }
}
