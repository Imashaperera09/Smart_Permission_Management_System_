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

var app = builder.Build();

// Health check endpoints
app.MapGet("/", () => "API is Running!");
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Version = "1.1" }));
app.MapGet("/api/health", () => Results.Ok(new { Status = "Healthy", Location = "api/health" }));

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

Console.WriteLine($"Starting API... Base URL: {supabaseUrl}");

// Explicitly ensure CORS is the very first middleware
app.UseCors("AllowAll");
app.UseAuthorization();

app.MapControllers();

app.Run();
