namespace TestCaseAssistant.Application.Contracts.Quality;

public sealed class QualityResultResponse
{
    public Guid TestCaseId { get; set; }
    public decimal OverallScore { get; set; }
    public List<QualityFindingResponse> Findings { get; set; } = [];
}
