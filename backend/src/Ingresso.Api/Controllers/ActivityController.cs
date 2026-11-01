using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ingresso.Application.Activity;
using Ingresso.Domain.Enums;

namespace Ingresso.Api.Controllers;

/// <summary>The signed-in person's security events, for Settings → Activity (L2-142 to L2-144).</summary>
[ApiController]
[Authorize]
[Route("api/activity")]
public sealed class ActivityController(ISender sender) : ControllerBase
{
    private static readonly Dictionary<string, ActivityCategory> Categories = Enum.GetValues<ActivityCategory>()
        .ToDictionary(c => GetActivityQueryHandler.Kebab(c.ToString()), StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// A page of events, newest first: <c>category</c> is sign-ins, app-access, sessions or apps-and-keys, and
    /// <c>before</c> is the <c>next</c> of the previous page. 400 for an unknown category.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ActivityPageDto>> List(string? category, long? before, CancellationToken cancellationToken)
    {
        ActivityCategory? filter = null;
        if (!string.IsNullOrEmpty(category))
        {
            if (!Categories.TryGetValue(category, out var known))
            {
                return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
                {
                    ["category"] = [$"'{category}' isn't a kind of activity."],
                }));
            }

            filter = known;
        }

        return await sender.Send(new GetActivityQuery(filter, before), cancellationToken);
    }
}
