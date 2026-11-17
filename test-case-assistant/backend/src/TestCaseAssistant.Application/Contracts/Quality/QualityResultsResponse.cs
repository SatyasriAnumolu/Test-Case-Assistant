namespace TestCaseAssistant.Application.Contracts.Quality;

public sealed class QualityResultsResponse
{
    public Guid AnalysisId { get; set; }
    public List<QualityResultResponse> Results { get; set; } = [];
}
