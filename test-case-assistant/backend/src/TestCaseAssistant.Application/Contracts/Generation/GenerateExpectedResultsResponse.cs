namespace TestCaseAssistant.Application.Contracts.Generation;

public sealed class GenerateExpectedResultsResponse
{
    public Guid TestCaseId { get; set; }
    public List<string> ExpectedResults { get; set; } = [];
    public decimal Confidence { get; set; }
}
