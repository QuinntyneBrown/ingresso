using System.Security.Cryptography;
using FluentValidation;
using MediatR;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Clients;

/// <summary>
/// Registers an app as an OpenID Connect client that must use PKCE (L2-087), from the CLI or Settings (L2-105). A
/// <paramref name="Confidential"/> app also gets a generated secret (L2-106); <paramref name="OfflineAccess"/> lets it ask for
/// refresh tokens (L2-107).
/// </summary>
public sealed record RegisterClientCommand(
    string? Name, IReadOnlyList<string>? RedirectUris, IReadOnlyList<string>? PostLogoutRedirectUris, IReadOnlyList<string>? Scopes = null,
    string? FrontChannelLogoutUri = null, bool Confidential = false, bool OfflineAccess = false)
    : IRequest<RegisteredClientDto>;

/// <summary>The app just registered, and its secret when it is confidential: the only time the secret leaves ingresso (L2-106).</summary>
public sealed record RegisteredClientDto(ClientDto Client, string? ClientSecret);

public sealed class RegisterClientCommandValidator : AbstractValidator<RegisterClientCommand>
{
    public const int NameMaxLength = 100;

    public RegisterClientCommandValidator()
    {
        RuleFor(c => c.Name).Cascade(CascadeMode.Stop)
            .Must(n => !string.IsNullOrWhiteSpace(n)).WithMessage("Enter a name for the app.")
            .Must(n => n!.Trim().Length <= NameMaxLength).WithMessage($"The name must be {NameMaxLength} characters or fewer.");
        RuleFor(c => c.RedirectUris).NotEmpty().WithMessage("Add at least one redirect address.");
        RuleForEach(c => c.RedirectUris).Custom(CheckAddress);
        RuleForEach(c => c.PostLogoutRedirectUris!).Custom(CheckAddress).When(c => c.PostLogoutRedirectUris is not null);
        RuleFor(c => c.FrontChannelLogoutUri!).Custom(CheckAddress).When(c => c.FrontChannelLogoutUri is not null);
    }

    private static void CheckAddress(string address, ValidationContext<RegisterClientCommand> context)
    {
        if (ClientAddressRules.Problem(address) is { } problem)
        {
            context.AddFailure(problem);
        }
    }
}

public sealed class RegisterClientCommandHandler(IClientRegistry clients, IResourceRegistry resources) : IRequestHandler<RegisterClientCommand, RegisteredClientDto>
{
    public async Task<RegisteredClientDto> Handle(RegisterClientCommand request, CancellationToken cancellationToken)
    {
        var name = request.Name!.Trim();
        var existing = await clients.ListAsync(cancellationToken);
        if (existing.Any(c => string.Equals(c.Name, name, StringComparison.OrdinalIgnoreCase)))
        {
            throw new ConflictException($"An app named '{name}' is already registered.");
        }

        // An app may be allowed only scopes some API has (L2-096).
        var scopes = Distinct(request.Scopes ?? []);
        var known = (await resources.ListAsync(cancellationToken)).SelectMany(r => r.Scopes).ToHashSet(StringComparer.Ordinal);
        if (scopes.FirstOrDefault(s => !known.Contains(s)) is { } unknown)
        {
            throw new NotFoundException($"No API has scope '{unknown}'.");
        }

        var frontChannel = request.FrontChannelLogoutUri?.Trim();
        // 256 random bits, base64url: shown once in the response, stored only as a hash (L2-106).
        var secret = request.Confidential ? Base64Url(RandomNumberGenerator.GetBytes(32)) : null;
        var client = new NewClient(
            name, Distinct(request.RedirectUris!), Distinct(request.PostLogoutRedirectUris ?? []), Scopes: scopes, FrontChannelLogoutUri: frontChannel,
            ClientSecret: secret, OfflineAccess: request.OfflineAccess);
        var clientId = await clients.RegisterAsync(client, cancellationToken);
        return new RegisteredClientDto(
            new ClientDto(
                clientId, client.Name, client.RedirectUris, client.PostLogoutRedirectUris, scopes, frontChannel, request.Confidential, request.OfflineAccess),
            secret);
    }

    private static string Base64Url(byte[] bytes) => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static List<string> Distinct(IEnumerable<string> addresses) => addresses.Select(a => a.Trim()).Distinct(StringComparer.Ordinal).ToList();
}
