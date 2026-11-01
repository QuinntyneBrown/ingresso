using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Ingresso.Api.Tests.Identity;
using Ingresso.Api.Tests.Infrastructure;

namespace Ingresso.Api.Tests.IdentityProvider;

/// <summary>L2-093: a person without a session signs in by email link and continues to the app.</summary>
public sealed class SignInForAppTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    // Acceptance Test
    // Traces to: L2-093
    // Description: The email link returns to the authorization request, which continues to the app with a code, even with a long state as real apps send.
    [Fact]
    public async Task The_email_link_continues_the_authorization_request_back_to_the_app()
    {
        var app = await RelyingParty.RegisterAsync(factory);
        var longState = new string('s', 1500);
        var email = $"person-{Guid.NewGuid():N}@example.com";
        var browser = factory.CreateHttpsClient();

        var toSignIn = await browser.GetAsync(app.AuthorizePath(new Dictionary<string, string?> { ["state"] = longState }));
        var returnUrl = Uri.UnescapeDataString(toSignIn.Headers.Location!.OriginalString["/sign-in?returnUrl=".Length..]);
        Assert.Equal(HttpStatusCode.Accepted, (await factory.RequestLink(email, returnUrl)).StatusCode);
        var redeemed = await browser.RedeemAsync(await factory.LatestToken(email));
        var toApp = await browser.GetAsync(redeemed.Headers.Location!.OriginalString);

        Assert.Equal(returnUrl, redeemed.Headers.Location!.OriginalString);
        Assert.Equal(HttpStatusCode.Redirect, toApp.StatusCode);
        var parameters = RelyingParty.CallbackParameters(toApp);
        Assert.False(string.IsNullOrEmpty(parameters["code"]));
        Assert.Equal(longState, parameters["state"]);
    }

    // Acceptance Test
    // Traces to: L2-093
    // Description: The sign-in page can name the app from its client ID; an unknown client ID is not found.
    [Fact]
    public async Task The_app_name_is_available_by_client_id_to_anyone()
    {
        var app = await RelyingParty.RegisterAsync(factory, "Budget");
        var anonymous = factory.CreateHttpsClient();

        var found = await anonymous.GetAsync($"/api/auth/apps/{app.ClientId}");
        var missing = await anonymous.GetAsync("/api/auth/apps/unknown-client");

        Assert.Equal(HttpStatusCode.OK, found.StatusCode);
        var name = (await found.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("name").GetString();
        Assert.StartsWith("Budget", name);
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }
}
