namespace TestCaseAssistant.Application.Contracts.Quality;

public sealed class QualityFindingResponse
{
    public string RuleId { get; set; } = string.Empty;
    public string Severity { get; set; } = "Medium";
    public string Message { get; set; } = string.Empty;
    public string SuggestedFix { get; set; } = string.Empty;
}
