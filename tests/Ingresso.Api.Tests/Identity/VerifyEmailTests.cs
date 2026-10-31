using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Api.Tests.Infrastructure;
using Ingresso.Domain.Entities;
using Ingresso.Domain.Enums;
using Ingresso.Infrastructure.Email;
using Ingresso.Infrastructure.Outbox;

namespace Ingresso.Api.Tests.Identity;

/// <summary>L2-029: an account's email is verified on first sign-in, and an unverified account cannot use tiles.</summary>
public sealed class VerifyEmailTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static string NewEmail() => $"verify-{Guid.NewGuid():N}@example.com";

    // Acceptance Test
    // Traces to: L2-029
    // Description: Redeeming a sign-in link for a first-time email marks that email verified.
    [Fact]
    public async Task Redeeming_a_first_sign_in_link_marks_the_email_verified()
    {
        var email = NewEmail();
        await factory.RequestLink(email);
        var token = await factory.LatestToken(email);

        var response = await factory.CreateHttpsClient().RedeemAsync(token);

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        var verified = await factory.WithDbAsync(db => db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == email));
        Assert.True(verified);
    }
}
