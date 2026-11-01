using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Ingresso.Application;
using Ingresso.Domain.Entities;
using Ingresso.Domain.Enums;
using Ingresso.Infrastructure;
using Ingresso.Infrastructure.Persistence;

namespace Ingresso.Cli.Tests;

public sealed class UserCommandsTests : IDisposable
{
    private readonly SqliteConnection connection = new("Data Source=:memory:");
    private readonly ServiceProvider services;

    public UserCommandsTests()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Clock:FixedUtcNow"] = "2026-11-02T14:00:00Z",
        }).Build();
        connection.Open();
        services = new ServiceCollection()
            .AddLogging()
            .AddDbContext<AppDbContext>(o => o.UseSqlite(connection))
            .AddApplication()
            .AddInfrastructureServices(configuration)
            .BuildServiceProvider();
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        db.Users.Add(User.CreateMember("maya@northwind.com", DateTimeOffset.UnixEpoch));
        db.SaveChanges();
    }

    // Acceptance Test
    // Traces to: L2-103
    // Description: users grant-admin makes the account an administrator and says so; running it again changes nothing.
    [Fact]
    public async Task Grant_admin_makes_the_account_an_administrator_once()
    {
        var (code, output) = await Run("users", "grant-admin", "--email", "Maya@Northwind.com");

        Assert.Equal(0, code);
        Assert.Equal("maya@northwind.com is now an administrator.", output.Trim());
        Assert.Equal(UserRole.Admin, await RoleOf("maya@northwind.com"));

        var again = await Run("users", "grant-admin", "--email", "maya@northwind.com");
        Assert.Equal(0, again.Code);
        Assert.Equal("maya@northwind.com is already an administrator.", again.Output.Trim());
    }

    // Acceptance Test
    // Traces to: L2-103
    // Description: users grant-admin with an unknown email fails, names the email, and makes no one an administrator.
    [Fact]
    public async Task Grant_admin_for_an_unknown_email_fails()
    {
        var (code, output) = await Run("users", "grant-admin", "--email", "nobody@example.com");

        Assert.Equal(1, code);
        Assert.Equal("No account has the email 'nobody@example.com'.", output.Trim());
        Assert.Equal(UserRole.Member, await RoleOf("maya@northwind.com"));
    }

    // Acceptance Test
    // Traces to: L2-103
    // Description: users without a known subcommand, or grant-admin without exactly one --email, prints the usage.
    [Theory]
    [InlineData("users")]
    [InlineData("users", "grant-admin")]
    [InlineData("users", "grant-admin", "--email", "a@example.com", "--email", "b@example.com")]
    [InlineData("users", "list")]
    public async Task Bad_arguments_print_the_usage(params string[] args)
    {
        var (code, output) = await Run(args);

        Assert.Equal(1, code);
        Assert.StartsWith("Usage: ingresso users", output);
    }

    private async Task<UserRole> RoleOf(string email)
    {
        using var scope = services.CreateScope();
        return (await scope.ServiceProvider.GetRequiredService<AppDbContext>().Users.SingleAsync(u => u.Email == email)).Role;
    }

    private async Task<(int Code, string Output)> Run(params string[] args)
    {
        var output = new StringWriter();
        var code = await CliApp.RunAsync(args, services, output);
        return (code, output.ToString());
    }

    public void Dispose()
    {
        services.Dispose();
        connection.Dispose();
    }
}
