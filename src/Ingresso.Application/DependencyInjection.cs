using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Application.Common.Behaviors;
using Ingresso.Application.Common.Interfaces;

namespace Ingresso.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });
        services.AddValidatorsFromAssembly(assembly);
        services.AddScoped<IAuditLog, Common.AuditLog>();
        return services;
    }
}
