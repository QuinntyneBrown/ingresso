using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Application.Clients;

namespace Ingresso.Api.Tests.Clients;

/// <summary>L2-104 to L2-106: listing and registering apps through /api/clients.</summary>
public sealed class ClientsApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<HttpClient> Administrator()
    {
        var client = factory.CreateHttpsClient();
        await client.SignInAsAsync($"admin-{Guid.NewGuid():N}@example.com", administrator: true);
        return client;
    }

    private async Task RegisterWithCliHandlerAsync(string name)
    {
        using var scope = factory.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<ISender>()
            .Send(new RegisterClientCommand(name, [$"https://{name.Replace(" ", "-").ToLowerInvariant()}.example.com/signin-oidc"], []));
    }

    // Acceptance Test
    // Traces to: L2-104
    // Description: An administrator lists every registered app by name with its client ID and type, sorted by name.
    [Fact]
    public async Task An_administrator_lists_the_registered_apps_sorted_by_name()
    {
        var admin = await Administrator();
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await RegisterWithCliHandlerAsync($"Zeta {suffix}");
        await RegisterWithCliHandlerAsync($"Alpha {suffix}");

        var response = await admin.GetAsync("/api/clients");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var apps = (await response.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray()
            .Where(a => a.GetProperty("name").GetString()!.EndsWith(suffix, StringComparison.Ordinal))
            .ToList();
        Assert.Equal([$"Alpha {suffix}", $"Zeta {suffix}"], apps.Select(a => a.GetProperty("name").GetString()));
        Assert.All(apps, a =>
        {
            Assert.False(string.IsNullOrEmpty(a.GetProperty("clientId").GetString()));
            Assert.False(a.GetProperty("confidential").GetBoolean());
            Assert.False(a.TryGetProperty("clientSecret", out _));
        });
    }
}
