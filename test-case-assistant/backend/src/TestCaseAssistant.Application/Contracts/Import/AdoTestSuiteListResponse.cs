namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class AdoTestSuiteListResponse
{
    public bool Success { get; set; }
    public string Organization { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public int PlanId { get; set; }
    public IReadOnlyList<AdoTestNodeOption> Suites { get; set; } = Array.Empty<AdoTestNodeOption>();
    public string Message { get; set; } = string.Empty;
}
