namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class ImportJobStatusResponse
{
    public Guid JobId { get; set; }
    public string Status { get; set; } = "Running";
    public int ImportedCount { get; set; }
    public int FailedCount { get; set; }
}
