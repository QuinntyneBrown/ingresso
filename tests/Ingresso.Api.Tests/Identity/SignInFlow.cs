using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Infrastructure.Email;
using Ingresso.Infrastructure.Outbox;

namespace Ingresso.Api.Tests.Identity;

/// <summary>Requests a sign-in link and reads its token back from the dev mailbox.</summary>
public static class SignInFlow
{
    public static Task<HttpResponseMessage> RequestLink(this ApiFactory factory, string email, string? returnUrl = null) =>
        factory.CreateHttpsClient().PostAsJsonAsync("/api/auth/sign-in-links", new { email, returnUrl });

    public static async Task<string> LatestToken(this ApiFactory factory, string email)
    {
        using (var scope = factory.Services.CreateScope())
        {
            await scope.ServiceProvider.GetRequiredService<OutboxDispatcher>().ProcessDueAsync(CancellationToken.None);
        }

        var body = factory.Services.GetRequiredService<DevMailbox>().For(email)
            .Last(m => m.Message.Subject == "Your ingresso sign-in link").Message.TextBody;
        var start = body.IndexOf("token=", StringComparison.Ordinal) + "token=".Length;
        return new string(body[start..].TakeWhile(c => !char.IsWhiteSpace(c)).ToArray());
    }

    /// <summary>Opens a sign-in link with <paramref name="client"/> and echoes the XSRF token on later requests.</summary>
    public static async Task<HttpResponseMessage> RedeemAsync(this HttpClient client, string token)
    {
        var response = await client.GetAsync($"/auth/redeem?token={Uri.EscapeDataString(token)}");
        var xsrf = response.Headers.TryGetValues("Set-Cookie", out var cookies)
            ? cookies.Select(c => c.Split(';')[0]).FirstOrDefault(c => c.StartsWith("XSRF-TOKEN=", StringComparison.Ordinal))?["XSRF-TOKEN=".Length..]
            : null;
        client.DefaultRequestHeaders.Remove("X-XSRF-TOKEN");
        if (xsrf is not null)
        {
            client.DefaultRequestHeaders.Add("X-XSRF-TOKEN", Uri.UnescapeDataString(xsrf));
        }

        return response;
    }
}
