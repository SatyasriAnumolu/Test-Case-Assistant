namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class AdoPublishedTestCaseResult
{
    public string Title { get; set; } = string.Empty;
    public bool Success { get; set; }
    public int? WorkItemId { get; set; }
    // Steps Azure DevOps reports as stored in Microsoft.VSTS.TCM.Steps on the created work item.
    public int StepCount { get; set; }
    public string? Error { get; set; }
    // True when an existing work item was updated rather than created.
    public bool Updated { get; set; }
}

public sealed class AdoPublishTestCasesResponse
{
    public bool Success { get; set; }
    public int CreatedCount { get; set; }
    public int FailedCount { get; set; }
    public IReadOnlyList<AdoPublishedTestCaseResult> Results { get; set; } = Array.Empty<AdoPublishedTestCaseResult>();
    public string Message { get; set; } = string.Empty;
}
