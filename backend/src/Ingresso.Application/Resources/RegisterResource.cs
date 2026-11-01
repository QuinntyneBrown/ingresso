using FluentValidation;
using MediatR;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Resources;

/// <summary>Registers an API and the scopes apps may ask for to call it (L2-095).</summary>
public sealed record RegisterResourceCommand(string? Name, string? Audience, IReadOnlyList<string> Scopes) : IRequest<ResourceDto>;

public sealed class RegisterResourceCommandValidator : AbstractValidator<RegisterResourceCommand>
{
    public const int MaxLength = 100;

    /// <summary>Scopes ingresso defines itself; an API cannot claim them.</summary>
    public static readonly string[] ReservedScopes = ["openid", "email", "profile", "offline_access"];

    public RegisterResourceCommandValidator()
    {
        RuleFor(c => c.Name).Cascade(CascadeMode.Stop)
            .Must(n => !string.IsNullOrWhiteSpace(n)).WithMessage("Enter a name for the API.")
            .Must(n => n!.Trim().Length <= MaxLength).WithMessage($"The name must be {MaxLength} characters or fewer.");
        RuleFor(c => c.Audience).Custom((audience, context) => Check("audience", audience, context));
        RuleFor(c => c.Scopes).NotEmpty().WithMessage("Add at least one --scope.");
        RuleForEach(c => c.Scopes).Custom((scope, context) =>
        {
            if (ReservedScopes.Contains(scope.Trim(), StringComparer.Ordinal))
            {
                context.AddFailure($"The scope '{scope}' is reserved by ingresso.");
                return;
            }

            Check("scope", scope, context);
        });
    }

    private static void Check(string what, string? value, ValidationContext<RegisterResourceCommand> context)
    {
        var trimmed = value?.Trim() ?? "";
        if (trimmed.Length == 0)
        {
            context.AddFailure($"Enter an {what}.");
        }
        else if (trimmed.Any(char.IsWhiteSpace))
        {
            context.AddFailure($"The {what} '{value}' must not contain spaces.");
        }
        else if (trimmed.Length > MaxLength)
        {
            context.AddFailure($"The {what} '{value}' must be {MaxLength} characters or fewer.");
        }
    }
}

public sealed class RegisterResourceCommandHandler(IResourceRegistry resources) : IRequestHandler<RegisterResourceCommand, ResourceDto>
{
    public async Task<ResourceDto> Handle(RegisterResourceCommand request, CancellationToken cancellationToken)
    {
        var resource = new ResourceDto(
            request.Name!.Trim(),
            request.Audience!.Trim(),
            request.Scopes.Select(s => s.Trim()).Distinct(StringComparer.Ordinal).ToList());
        var existing = await resources.ListAsync(cancellationToken);
        if (existing.Any(r => r.Audience == resource.Audience))
        {
            throw new ConflictException($"An API with audience '{resource.Audience}' is already registered.");
        }

        if (resource.Scopes.FirstOrDefault(s => existing.Any(r => r.Scopes.Contains(s))) is { } taken)
        {
            throw new ConflictException($"The scope '{taken}' is already registered.");
        }

        await resources.RegisterAsync(resource, cancellationToken);
        return resource;
    }
}
