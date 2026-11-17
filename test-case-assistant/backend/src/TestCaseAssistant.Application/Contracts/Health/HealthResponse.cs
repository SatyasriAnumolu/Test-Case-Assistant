namespace TestCaseAssistant.Application.Contracts.Health;

public sealed class HealthResponse
{
    public string Status { get; set; } = "ok";
    public string Service { get; set; } = "TestCaseAssistant.Api";
}
