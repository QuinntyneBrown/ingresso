using FluentValidation;
using MediatR;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Clients;

/// <summary>Registers an app as a public OpenID Connect client that must use PKCE (L2-087).</summary>
public sealed record RegisterClientCommand(
    string? Name, IReadOnlyList<string> RedirectUris, IReadOnlyList<string> PostLogoutRedirectUris, IReadOnlyList<string>? Scopes = null)
    : IRequest<ClientDto>;

public sealed class RegisterClientCommandValidator : AbstractValidator<RegisterClientCommand>
{
    public const int NameMaxLength = 100;

    public RegisterClientCommandValidator()
    {
        RuleFor(c => c.Name).Cascade(CascadeMode.Stop)
            .Must(n => !string.IsNullOrWhiteSpace(n)).WithMessage("Enter a name for the app.")
            .Must(n => n!.Trim().Length <= NameMaxLength).WithMessage($"The name must be {NameMaxLength} characters or fewer.");
        RuleFor(c => c.RedirectUris).NotEmpty().WithMessage("Add at least one --redirect-uri.");
        RuleForEach(c => c.RedirectUris).Custom(CheckAddress);
        RuleForEach(c => c.PostLogoutRedirectUris).Custom(CheckAddress);
    }

    private static void CheckAddress(string address, ValidationContext<RegisterClientCommand> context)
    {
        if (ClientAddressRules.Problem(address) is { } problem)
        {
            context.AddFailure(problem);
        }
    }
}

public sealed class RegisterClientCommandHandler(IClientRegistry clients, IResourceRegistry resources) : IRequestHandler<RegisterClientCommand, ClientDto>
{
    public async Task<ClientDto> Handle(RegisterClientCommand request, CancellationToken cancellationToken)
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

        var client = new NewClient(name, Distinct(request.RedirectUris), Distinct(request.PostLogoutRedirectUris), Scopes: scopes);
        var clientId = await clients.RegisterAsync(client, cancellationToken);
        return new ClientDto(clientId, client.Name, client.RedirectUris, client.PostLogoutRedirectUris, scopes);
    }

    private static List<string> Distinct(IEnumerable<string> addresses) => addresses.Select(a => a.Trim()).Distinct(StringComparer.Ordinal).ToList();
}
