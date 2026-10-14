
using SearchAPI.Models;

namespace SearchAPI.Services;

public sealed class ListingSearchService
{
    public List<Listing> Search(
        IEnumerable<Listing> listings,
        string? source = null,
        string? city = null,
        string? status = null,
        string? q = null)
    {
        IEnumerable<Listing> results = listings;

        if (!string.IsNullOrWhiteSpace(source))
        {
            results = results.Where(x =>
                string.Equals(
                    x.Source,
                    source,
                    StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(city))
        {
            results = results.Where(x =>
                x.City.Contains(
                    city,
                    StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            results = results.Where(x =>
                string.Equals(
                    x.Status,
                    status,
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

        return results.ToList();
    }
}
