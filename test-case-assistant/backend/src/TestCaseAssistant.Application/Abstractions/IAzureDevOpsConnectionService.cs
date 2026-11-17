using TestCaseAssistant.Application.Contracts.Import;

namespace TestCaseAssistant.Application.Abstractions;

public interface IAzureDevOpsConnectionService
{
    Task<AdoConnectionStatusResponse> CheckConnectionAsync(CancellationToken cancellationToken);
    Task<AdoConnectionStatusResponse> CheckConnectionAsync(string? organization, string? project, string? pat, CancellationToken cancellationToken);
    Task<AdoProjectListResponse> ListProjectsAsync(string? organization, string? pat, CancellationToken cancellationToken);
    Task<AdoAreaPathListResponse> ListAreaPathsAsync(string? organization, string? project, string? pat, CancellationToken cancellationToken);
    Task<AdoTestPlanListResponse> ListTestPlansAsync(string? organization, string? project, IReadOnlyList<string>? areaPaths, string? pat, CancellationToken cancellationToken);
    Task<AdoTestSuiteListResponse> ListTestSuitesAsync(string? organization, string? project, int planId, string? pat, CancellationToken cancellationToken);
    Task<AdoSyncTestCasesResponse> SyncTestCasesAsync(AdoSyncTestCasesRequest request, CancellationToken cancellationToken);
    Task<AdoPublishTestCasesResponse> PublishTestCasesAsync(AdoPublishTestCasesRequest request, CancellationToken cancellationToken);
}
