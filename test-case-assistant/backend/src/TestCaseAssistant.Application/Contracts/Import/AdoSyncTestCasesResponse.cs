namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class AdoTestCaseSummary
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string AreaPath { get; set; } = string.Empty;
    public string IterationPath { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string? Priority { get; set; }
    public int StepCount { get; set; }
}

public sealed class AdoSyncTestCasesResponse
{
    public bool Success { get; set; }
    public string Organization { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public IReadOnlyList<string> AreaPaths { get; set; } = Array.Empty<string>();
    public int? PlanId { get; set; }
    public int? SuiteId { get; set; }
    public string Scope { get; set; } = "all";
    public int ImportedCount { get; set; }
    public DateTimeOffset SyncedAt { get; set; }
    public IReadOnlyList<AdoTestCaseSummary> TestCases { get; set; } = Array.Empty<AdoTestCaseSummary>();
    public string Message { get; set; } = string.Empty;
}
