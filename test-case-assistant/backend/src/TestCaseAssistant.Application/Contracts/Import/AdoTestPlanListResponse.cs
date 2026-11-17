namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class AdoTestPlanListResponse
{
    public bool Success { get; set; }
    public string Organization { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public IReadOnlyList<AdoTestNodeOption> Plans { get; set; } = Array.Empty<AdoTestNodeOption>();
    public string Message { get; set; } = string.Empty;
}
