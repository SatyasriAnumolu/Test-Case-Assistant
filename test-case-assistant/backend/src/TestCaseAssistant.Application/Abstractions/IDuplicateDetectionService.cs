using TestCaseAssistant.Application.Contracts.Duplicates;

namespace TestCaseAssistant.Application.Abstractions;

public interface IDuplicateDetectionService
{
    Task<Guid> AnalyzeAsync(DuplicateAnalysisRequest request, CancellationToken cancellationToken);
    Task<DuplicateGroupsResponse?> GetGroupsAsync(Guid runId, CancellationToken cancellationToken);
}
