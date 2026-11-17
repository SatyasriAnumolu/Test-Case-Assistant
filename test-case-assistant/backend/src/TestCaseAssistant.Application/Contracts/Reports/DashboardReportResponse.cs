namespace TestCaseAssistant.Application.Contracts.Reports;

public sealed class DashboardReportResponse
{
    public Guid WorkspaceId { get; set; }
    public int TotalTestCases { get; set; }
    public decimal AverageQualityScore { get; set; }
    public decimal DuplicateRate { get; set; }
    public int UncoveredRequirementCount { get; set; }
}
