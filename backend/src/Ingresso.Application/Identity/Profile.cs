using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ingresso.Application.Common.Exceptions;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application.Identity;

/// <summary>The signed-in person's profile for Settings → Profile (L2-117). <c>DisplayName</c> is null when not set.</summary>
public sealed record ProfileDto(string? DisplayName, string Email, bool EmailVerified);

public sealed record GetProfileQuery : IRequest<ProfileDto>;

/// <summary>Sets the display name, trimmed; empty or whitespace clears it (L2-117).</summary>
public sealed record UpdateProfileCommand(string? DisplayName) : IRequest<ProfileDto>;

public sealed class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public const int MaxLength = 100;

    public UpdateProfileCommandValidator()
    {
        RuleFor(c => c.DisplayName)
            .Must(n => (n?.Trim().Length ?? 0) <= MaxLength)
            .WithMessage($"Keep your display name to {MaxLength} characters or fewer.")
            .Must(n => n is null || !n.Trim().Any(char.IsControl))
            .WithMessage("Your display name can't contain line breaks or control characters.");
    }
}

public sealed class ProfileHandlers(IAppDbContext db, ICurrentUser current)
    : IRequestHandler<GetProfileQuery, ProfileDto>, IRequestHandler<UpdateProfileCommand, ProfileDto>
{
    public async Task<ProfileDto> Handle(GetProfileQuery request, CancellationToken cancellationToken) =>
        await ToDtoAsync(await CurrentAsync(cancellationToken), cancellationToken);

    public async Task<ProfileDto> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await CurrentAsync(cancellationToken);
        var name = request.DisplayName?.Trim();
        user.Name = string.IsNullOrEmpty(name) ? null : name;
        await db.SaveChangesAsync(cancellationToken);
        return await ToDtoAsync(user, cancellationToken);
    }

    private async Task<Domain.Entities.User> CurrentAsync(CancellationToken cancellationToken) =>
        current.UserId is { } id && await db.Users.SingleOrDefaultAsync(u => u.Id == id, cancellationToken) is { } user
            ? user
            : throw new NotFoundException("The signed-in account no longer exists.");

    private async Task<ProfileDto> ToDtoAsync(Domain.Entities.User user, CancellationToken cancellationToken)
    {
        var email = user.Email.Trim().ToLowerInvariant();
        var verified = await db.VerifiedEmails.AnyAsync(v => v.NormalizedEmail == email, cancellationToken);
        return new ProfileDto(user.Name, user.Email, verified);
    }
}
