using Supabase;
using SmartLeave.Api.Models;
using SmartLeave.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Supabase
var supabaseUrl = builder.Configuration["Supabase:Url"];
var supabaseKey = builder.Configuration["Supabase:Key"];
var options = new SupabaseOptions
{
    AutoConnectRealtime = true
};

builder.Services.AddSingleton(provider => new Supabase.Client(supabaseUrl!, supabaseKey, options));
builder.Services.AddScoped<ILeaveRuleService, SmartLeave.Api.Services.LeaveRuleService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

// Use Render's dynamic port or default to 8080
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var app = builder.Build();

// Global Exception Handler to capture 500s and return with CORS
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        await context.Response.WriteAsJsonAsync(new { 
            Status = "Critical Error", 
            Message = ex.Message,
            Type = ex.GetType().Name
        });
    }
});

// Health check endpoints
app.MapGet("/", () => "Smart Leave API is LIVE!");
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Version = "1.2" }));

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

Console.WriteLine($"API STARTING on Port: {port}. Supabase: {supabaseUrl}");

app.UseCors("AllowAll");
app.UseAuthorization();

app.MapControllers();

app.Run();
