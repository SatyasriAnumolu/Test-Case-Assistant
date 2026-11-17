namespace TestCaseAssistant.Application.Contracts.TestCases;

public sealed class TestCaseResponse
{
    public Guid TestCaseId { get; set; }
    public string ExternalId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal QualityScore { get; set; }
}
