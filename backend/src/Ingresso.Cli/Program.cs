using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Ingresso.Application;
using Ingresso.Cli;
using Ingresso.Infrastructure;

var builder = Host.CreateApplicationBuilder(new HostApplicationBuilderSettings
{
    Args = [],
    ContentRootPath = AppContext.BaseDirectory,
});
builder.Configuration.AddEnvironmentVariables();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

using var host = builder.Build();
return await CliApp.RunAsync(args, host.Services, Console.Out);
