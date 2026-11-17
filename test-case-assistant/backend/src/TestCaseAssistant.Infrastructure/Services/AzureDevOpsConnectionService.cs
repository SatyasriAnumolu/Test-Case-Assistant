using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TestCaseAssistant.Application.Abstractions;
using TestCaseAssistant.Application.Contracts.Import;

namespace TestCaseAssistant.Infrastructure.Services;

public sealed class AzureDevOpsConnectionService : IAzureDevOpsConnectionService
{
    private readonly HttpClient _httpClient;
    private readonly AzureDevOpsOptions _options;
    private readonly ILogger<AzureDevOpsConnectionService> _logger;

    public AzureDevOpsConnectionService(
        HttpClient httpClient,
        IOptions<AzureDevOpsOptions> options,
        ILogger<AzureDevOpsConnectionService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<AdoConnectionStatusResponse> CheckConnectionAsync(CancellationToken cancellationToken)
    {
        return await CheckConnectionAsync(null, null, null, cancellationToken);
    }

    public async Task<AdoConnectionStatusResponse> CheckConnectionAsync(string? organization, string? project, string? pat, CancellationToken cancellationToken)
    {
        organization = string.IsNullOrWhiteSpace(organization)
            ? _options.Organization?.Trim() ?? string.Empty
            : organization.Trim();

        project = string.IsNullOrWhiteSpace(project)
            ? _options.Project?.Trim() ?? string.Empty
            : project.Trim();

        if (string.IsNullOrWhiteSpace(organization) || string.IsNullOrWhiteSpace(project))
        {
            return new AdoConnectionStatusResponse
            {
                Success = false,
                Organization = organization,
                Project = project,
                Message = "AzureDevOps:Organization and AzureDevOps:Project must be configured.",
            };
        }

        pat = ResolvePat(pat);
        if (string.IsNullOrWhiteSpace(pat))
        {
            return new AdoConnectionStatusResponse
            {
                Success = false,
                Organization = organization,
                Project = project,
                Message = "PAT not found. Set AzureDevOps:Pat, AZURE_DEVOPS_PAT, or an env var named by AzureDevOps:PatSecretName.",
            };
        }

        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://dev.azure.com/{organization}/_apis/projects/{project}?api-version=7.1-preview.4");

        request.Headers.Authorization = new AuthenticationHeaderValue(
            "Basic",
            Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pat}")));

        var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return new AdoConnectionStatusResponse
            {
                Success = false,
                Organization = organization,
                Project = project,
                Message = $"ADO connection failed ({(int)response.StatusCode}): {body}",
            };
        }

        var projectId = TryReadProjectId(body);
        return new AdoConnectionStatusResponse
        {
            Success = true,
            Organization = organization,
            Project = project,
            ProjectId = projectId,
            Message = "Connected successfully to Azure DevOps project.",
        };
    }

    public async Task<AdoProjectListResponse> ListProjectsAsync(string? organization, string? pat, CancellationToken cancellationToken)
    {
        organization = string.IsNullOrWhiteSpace(organization)
            ? _options.Organization?.Trim() ?? string.Empty
            : organization.Trim();

        if (string.IsNullOrWhiteSpace(organization))
        {
            return new AdoProjectListResponse
            {
                Success = false,
                Organization = organization,
                Message = "An Azure DevOps organization is required.",
            };
        }

        pat = ResolvePat(pat);
        if (string.IsNullOrWhiteSpace(pat))
        {
            return new AdoProjectListResponse
            {
                Success = false,
                Organization = organization,
                Message = "A personal access token is required to list projects.",
            };
        }

        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://dev.azure.com/{organization}/_apis/projects?api-version=7.1-preview.4&$top=500");

        request.Headers.Authorization = new AuthenticationHeaderValue(
            "Basic",
            Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pat}")));

        var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return new AdoProjectListResponse
            {
                Success = false,
                Organization = organization,
                Message = $"Could not list projects ({(int)response.StatusCode}): {body}",
            };
        }

        var projects = ReadProjectNames(body);
        return new AdoProjectListResponse
        {
            Success = true,
            Organization = organization,
            Projects = projects,
            Message = $"{projects.Count} projects found.",
        };
    }

    public async Task<AdoAreaPathListResponse> ListAreaPathsAsync(string? organization, string? project, string? pat, CancellationToken cancellationToken)
    {
        organization = string.IsNullOrWhiteSpace(organization)
            ? _options.Organization?.Trim() ?? string.Empty
            : organization.Trim();

        project = string.IsNullOrWhiteSpace(project)
            ? _options.Project?.Trim() ?? string.Empty
            : project.Trim();

        if (string.IsNullOrWhiteSpace(organization) || string.IsNullOrWhiteSpace(project))
        {
            return new AdoAreaPathListResponse
            {
                Success = false,
                Organization = organization,
                Project = project,
                Message = "An Azure DevOps organization and project are required.",
            };
        }

        pat = ResolvePat(pat);
        if (string.IsNullOrWhiteSpace(pat))
        {
            return new AdoAreaPathListResponse
            {
                Success = false,
                Organization = organization,
                Project = project,
                Message = "A personal access token is required to list area paths.",
            };
        }

        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://dev.azure.com/{organization}/{Uri.EscapeDataString(project)}/_apis/wit/classificationnodes/areas?$depth=10&api-version=7.1-preview.2");

        request.Headers.Authorization = new AuthenticationHeaderValue(
            "Basic",
            Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pat}")));

        var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return new AdoAreaPathListResponse
            {
                Success = false,
                Organization = organization,
                Project = project,
                Message = $"Could not list area paths ({(int)response.StatusCode}): {body}",
            };
        }

        var areaPaths = ReadAreaPaths(body, project);
        return new AdoAreaPathListResponse
        {
            Success = true,
            Organization = organization,
            Project = project,
            AreaPaths = areaPaths,
            Message = $"{areaPaths.Count} area paths found.",
        };
    }

    public async Task<AdoTestPlanListResponse> ListTestPlansAsync(string? organization, string? project, IReadOnlyList<string>? areaPaths, string? pat, CancellationToken cancellationToken)
    {
        organization = string.IsNullOrWhiteSpace(organization)
            ? _options.Organization?.Trim() ?? string.Empty
            : organization.Trim();

        project = string.IsNullOrWhiteSpace(project)
            ? _options.Project?.Trim() ?? string.Empty
            : project.Trim();

        if (string.IsNullOrWhiteSpace(organization) || string.IsNullOrWhiteSpace(project))
        {
            return new AdoTestPlanListResponse
            {
                Success = false,
                Organization = organization,
                Project = project,
                Message = "An Azure DevOps organization and project are required.",
            };
        }

        pat = ResolvePat(pat);
        if (string.IsNullOrWhiteSpace(pat))
        {
            return new AdoTestPlanListResponse
            {
                Success = false,
                Organization = organization,
                Project = project,
                Message = "A personal access token is required to list test plans.",
            };
        }

        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://dev.azure.com/{organization}/{Uri.EscapeDataString(project)}/_apis/testplan/plans?api-version=7.1-preview.1");

        AddAuthorization(request, pat);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return new AdoTestPlanListResponse
            {
                Success = false,
                Organization = organization,
                Project = project,
                Message = $"Could not list test plans ({(int)response.StatusCode}): {body}",
            };
        }

        // Test plans are project-scoped in Azure DevOps; area path does not narrow them.
        var plans = ReadTestNodeOptions(body);

        return new AdoTestPlanListResponse
        {
            Success = true,
            Organization = organization,
            Project = project,
            Plans = plans,
            Message = $"{plans.Count} test plans found.",
        };
    }

    public async Task<AdoTestSuiteListResponse> ListTestSuitesAsync(string? organization, string? project, int planId, string? pat, CancellationToken cancellationToken)
    {
        organization = string.IsNullOrWhiteSpace(organization)
            ? _options.Organization?.Trim() ?? string.Empty
            : organization.Trim();

        project = string.IsNullOrWhiteSpace(project)
            ? _options.Project?.Trim() ?? string.Empty
            : project.Trim();

        if (string.IsNullOrWhiteSpace(organization) || string.IsNullOrWhiteSpace(project) || planId <= 0)
        {
            return new AdoTestSuiteListResponse
            {
                Success = false,
                Organization = organization,
                Project = project,
                PlanId = planId,
                Message = "An Azure DevOps organization, project, and plan id are required.",
            };
        }

        pat = ResolvePat(pat);
        if (string.IsNullOrWhiteSpace(pat))
        {
            return new AdoTestSuiteListResponse
            {
                Success = false,
                Organization = organization,
                Project = project,
                PlanId = planId,
                Message = "A personal access token is required to list test suites.",
            };
        }

        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://dev.azure.com/{organization}/{Uri.EscapeDataString(project)}/_apis/testplan/Plans/{planId}/suites?asTreeView=true&api-version=7.1-preview.1");

        AddAuthorization(request, pat);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return new AdoTestSuiteListResponse
            {
                Success = false,
                Organization = organization,
                Project = project,
                PlanId = planId,
                Message = $"Could not list test suites ({(int)response.StatusCode}): {body}",
            };
        }

        var suites = ReadTestNodeOptions(body);
        _logger.LogInformation("Listed {Count} suites for PlanId={PlanId}", suites.Count, planId);

        return new AdoTestSuiteListResponse
        {
            Success = true,
            Organization = organization,
            Project = project,
            PlanId = planId,
            Suites = suites,
            Message = $"{suites.Count} test suites found.",
        };
    }

    public async Task<AdoSyncTestCasesResponse> SyncTestCasesAsync(AdoSyncTestCasesRequest request, CancellationToken cancellationToken)
    {
        var organization = string.IsNullOrWhiteSpace(request.Organization)
            ? _options.Organization?.Trim() ?? string.Empty
            : request.Organization.Trim();

        var project = string.IsNullOrWhiteSpace(request.Project)
            ? _options.Project?.Trim() ?? string.Empty
            : request.Project.Trim();

        var areaPaths = request.AreaPaths
            .Where(path => !string.IsNullOrWhiteSpace(path))
            .Select(path => path.Trim())
            .ToList();

        var scope = string.IsNullOrWhiteSpace(request.Scope) ? "all" : request.Scope.Trim().ToLowerInvariant();
        var planId = request.PlanId.GetValueOrDefault();
        var suiteId = request.SuiteId.GetValueOrDefault();

        if (string.IsNullOrWhiteSpace(organization) || string.IsNullOrWhiteSpace(project))
        {
            return SyncFailure(organization, project, areaPaths, "An Azure DevOps organization and project are required.");
        }

        if (scope == "suite" && (planId <= 0 || suiteId <= 0))
        {
            return SyncFailure(organization, project, areaPaths, "Test Plan and Test Suite are required for selected suite sync.");
        }

        if (scope == "plan" && planId <= 0)
        {
            return SyncFailure(organization, project, areaPaths, "A Test Plan is required for test plan sync.");
        }

        var pat = ResolvePat(request.Pat);
        if (string.IsNullOrWhiteSpace(pat))
        {
            return SyncFailure(organization, project, areaPaths, "A personal access token is required to sync test cases.");
        }

        _logger.LogInformation(
            "ADO sync requested. Project={Project} Scope={Scope} PlanId={PlanId} SuiteId={SuiteId} AreaPaths={AreaPathCount}",
            project,
            scope,
            planId,
            suiteId,
            areaPaths.Count);

        List<int> filteredIds;

        if (scope == "suite")
        {
            var suiteIdsResult = await QueryTestCaseIdsForSuiteTreeAsync(
                organization,
                project,
                planId,
                suiteId,
                pat,
                cancellationToken);

            if (suiteIdsResult.Error is not null)
            {
                _logger.LogWarning(
                    "ADO suite sync failed for PlanId={PlanId} SuiteId={SuiteId}: {Error}",
                    planId,
                    suiteId,
                    suiteIdsResult.Error);
                return SyncFailure(organization, project, areaPaths, suiteIdsResult.Error);
            }

            filteredIds = suiteIdsResult.Ids.Distinct().ToList();

            _logger.LogInformation(
                "ADO suite sync resolved {IdCount} test case ids for PlanId={PlanId} SuiteId={SuiteId}",
                filteredIds.Count,
                planId,
                suiteId);
        }
        else if (scope == "plan")
        {
            var planIdsResult = await QueryTestCaseIdsForPlanAsync(
                organization,
                project,
                planId,
                pat,
                cancellationToken);

            if (planIdsResult.Error is not null)
            {
                _logger.LogWarning(
                    "ADO plan sync failed for PlanId={PlanId}: {Error}",
                    planId,
                    planIdsResult.Error);
                return SyncFailure(organization, project, areaPaths, planIdsResult.Error);
            }

            filteredIds = planIdsResult.Ids.Distinct().ToList();

            _logger.LogInformation(
                "ADO plan sync resolved {IdCount} test case ids for PlanId={PlanId}",
                filteredIds.Count,
                planId);
        }
        else
        {
            var ids = await QueryTestCaseIdsAsync(organization, project, pat, areaPaths, cancellationToken);
            if (ids.Error is not null)
            {
                return SyncFailure(organization, project, areaPaths, ids.Error);
            }

            filteredIds = ids.Ids.Distinct().ToList();
        }

        var batches = filteredIds.Chunk(200).ToList();
        _logger.LogInformation(
            "ADO sync fetching details for {IdCount} test cases in {BatchCount} batches",
            filteredIds.Count,
            batches.Count);

        var batchResults = new (IReadOnlyList<AdoTestCaseSummary> Items, string? Error)[batches.Count];
        var completedBatches = 0;
        using var batchCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

        try
        {
            await Parallel.ForEachAsync(
                Enumerable.Range(0, batches.Count),
                new ParallelOptions { MaxDegreeOfParallelism = 8, CancellationToken = batchCts.Token },
                async (index, token) =>
                {
                    var result = await FetchTestCaseBatchAsync(organization, pat, batches[index], token);
                    batchResults[index] = result;
                    if (result.Error is not null)
                    {
                        batchCts.Cancel();
                        return;
                    }

                    var done = Interlocked.Increment(ref completedBatches);
                    if (done % 10 == 0 || done == batches.Count)
                    {
                        _logger.LogInformation("ADO sync progress: {Done}/{Total} batches", done, batches.Count);
                    }
                });
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            // A batch failed and cancelled the rest; its error is reported below.
        }

        var failedBatch = batchResults.FirstOrDefault(result => result.Error is not null);
        if (failedBatch.Error is not null)
        {
            return SyncFailure(organization, project, areaPaths, failedBatch.Error);
        }

        var testCases = batchResults.SelectMany(result => result.Items ?? Array.Empty<AdoTestCaseSummary>()).ToList();

        _logger.LogInformation(
            "ADO sync completed. Scope={Scope} PlanId={PlanId} SuiteId={SuiteId} ReturnedTestCases={Count}",
            scope,
            planId,
            suiteId,
            testCases.Count);

        return new AdoSyncTestCasesResponse
        {
            Success = true,
            Organization = organization,
            Project = project,
            AreaPaths = areaPaths,
            PlanId = scope is "suite" or "plan" ? planId : null,
            SuiteId = scope == "suite" ? suiteId : null,
            Scope = scope,
            ImportedCount = testCases.Count,
            SyncedAt = DateTimeOffset.UtcNow,
            TestCases = testCases.OrderBy(item => item.Id).ToList(),
            Message = scope == "plan"
                ? testCases.Count == 0
                    ? $"No test cases found in the selected test plan ({planId})."
                    : $"{testCases.Count} test cases imported from the selected test plan."
                : scope == "suite"
                ? testCases.Count == 0
                    ? $"No test cases found in the selected suite (plan {planId}, suite {suiteId})."
                    : $"{testCases.Count} test cases imported from selected suite."
                : areaPaths.Count == 0
                    ? $"{testCases.Count} test cases imported from {project}."
                    : $"{testCases.Count} test cases imported from {string.Join(", ", areaPaths)}.",
        };
    }

    private static AdoSyncTestCasesResponse SyncFailure(string organization, string project, IReadOnlyList<string> areaPaths, string message) =>
        new()
        {
            Success = false,
            Organization = organization,
            Project = project,
            AreaPaths = areaPaths,
            Message = message,
        };

    private async Task<(IReadOnlyList<int> Ids, string? Error)> QueryTestCaseIdsAsync(
        string organization,
        string project,
        string pat,
        IReadOnlyList<string> areaPaths,
        CancellationToken cancellationToken)
    {
        var conditions = new StringBuilder(
            $"[System.TeamProject] = '{EscapeWiql(project)}' AND [System.WorkItemType] = 'Test Case'");

        if (areaPaths.Count > 0)
        {
            var areaClauses = areaPaths.Select(path => $"[System.AreaPath] UNDER '{EscapeWiql(path)}'");
            conditions.Append(" AND (").Append(string.Join(" OR ", areaClauses)).Append(')');
        }

        // WIQL rejects queries matching more than 20,000 items (VS402337), so page through IDs with a cursor.
        const int pageSize = 10000;
        var allIds = new List<int>();
        var lastId = 0;

        while (true)
        {
            var wiql = $"SELECT [System.Id] FROM WorkItems WHERE {conditions} AND [System.Id] > {lastId} ORDER BY [System.Id]";

            var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"https://dev.azure.com/{organization}/{Uri.EscapeDataString(project)}/_apis/wit/wiql?$top={pageSize}&api-version=7.1-preview.2")
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new { query = wiql }),
                    Encoding.UTF8,
                    "application/json"),
            };

            AddAuthorization(request, pat);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return (Array.Empty<int>(), $"Test case query failed ({(int)response.StatusCode}): {body}");
            }

            List<int> pageIds;
            try
            {
                using var document = JsonDocument.Parse(body);
                if (!document.RootElement.TryGetProperty("workItems", out var workItems))
                {
                    break;
                }

                pageIds = workItems
                    .EnumerateArray()
                    .Where(item => item.TryGetProperty("id", out _))
                    .Select(item => item.GetProperty("id").GetInt32())
                    .ToList();
            }
            catch (JsonException exception)
            {
                return (Array.Empty<int>(), $"Could not read the test case query response: {exception.Message}");
            }

            allIds.AddRange(pageIds);

            if (pageIds.Count < pageSize)
            {
                break;
            }

            lastId = pageIds.Max();
        }

        return (allIds, null);
    }

    private async Task<(IReadOnlyList<int> Ids, string? Error)> QueryTestCaseIdsForSuiteTreeAsync(
        string organization,
        string project,
        int planId,
        int suiteId,
        string pat,
        CancellationToken cancellationToken)
    {
        var suiteIdsResult = await ResolveSuiteAndDescendantIdsAsync(
            organization,
            project,
            planId,
            suiteId,
            pat,
            cancellationToken);

        if (suiteIdsResult.Error is not null)
        {
            return (Array.Empty<int>(), suiteIdsResult.Error);
        }

        _logger.LogInformation(
            "ADO suite tree for PlanId={PlanId} SuiteId={SuiteId} resolved to suites [{SuiteIds}]",
            planId,
            suiteId,
            string.Join(", ", suiteIdsResult.Ids));

        var testCaseIds = new HashSet<int>();
        foreach (var currentSuiteId in suiteIdsResult.Ids)
        {
            var result = await QueryTestCaseIdsForSuiteAsync(
                organization,
                project,
                planId,
                currentSuiteId,
                pat,
                cancellationToken);

            if (result.Error is not null)
            {
                _logger.LogWarning(
                    "ADO suite {SuiteId} test case lookup failed: {Error}",
                    currentSuiteId,
                    result.Error);

                // Only surface an error for the suite the user picked; child suites are best-effort.
                if (currentSuiteId == suiteId)
                {
                    return (Array.Empty<int>(), result.Error);
                }

                continue;
            }

            _logger.LogDebug(
                "ADO suite {SuiteId} returned {Count} test case ids",
                currentSuiteId,
                result.Ids.Count);

            foreach (var id in result.Ids)
            {
                testCaseIds.Add(id);
            }
        }

        return (testCaseIds.ToList(), null);
    }

    private async Task<(IReadOnlyList<int> Ids, string? Error)> QueryTestCaseIdsForPlanAsync(
        string organization,
        string project,
        int planId,
        string pat,
        CancellationToken cancellationToken)
    {
        var suiteIds = await ResolveAllSuiteIdsForPlanAsync(organization, project, planId, pat, cancellationToken);
        if (suiteIds.Count == 0)
        {
            return (Array.Empty<int>(), $"No test suites found for plan {planId}.");
        }

        _logger.LogInformation(
            "ADO plan {PlanId} contains {SuiteCount} suites",
            planId,
            suiteIds.Count);

        // A large plan can hold hundreds of suites, so fan out instead of walking them serially.
        using var throttle = new SemaphoreSlim(8);
        var lookups = suiteIds.Select(async currentSuiteId =>
        {
            await throttle.WaitAsync(cancellationToken);
            try
            {
                return (SuiteId: currentSuiteId, Result: await QueryTestCaseIdsForSuiteAsync(
                    organization,
                    project,
                    planId,
                    currentSuiteId,
                    pat,
                    cancellationToken));
            }
            finally
            {
                throttle.Release();
            }
        });

        var results = await Task.WhenAll(lookups);

        var testCaseIds = new HashSet<int>();
        foreach (var (currentSuiteId, result) in results)
        {
            if (result.Error is not null)
            {
                _logger.LogWarning(
                    "ADO suite {SuiteId} test case lookup failed: {Error}",
                    currentSuiteId,
                    result.Error);
                continue;
            }

            foreach (var id in result.Ids)
            {
                testCaseIds.Add(id);
            }
        }

        return (testCaseIds.ToList(), null);
    }

    private async Task<IReadOnlyList<int>> ResolveAllSuiteIdsForPlanAsync(
        string organization,
        string project,
        int planId,
        string pat,
        CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://dev.azure.com/{organization}/{Uri.EscapeDataString(project)}/_apis/testplan/Plans/{planId}/suites?asTreeView=true&api-version=7.1");

        AddAuthorization(request, pat);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return Array.Empty<int>();
        }

        return ReadTestNodeOptions(body).Select(node => node.Id).ToList();
    }

    private async Task<(IReadOnlyList<int> Ids, string? Error)> ResolveSuiteAndDescendantIdsAsync(
        string organization,
        string project,
        int planId,
        int suiteId,
        string pat,
        CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://dev.azure.com/{organization}/{Uri.EscapeDataString(project)}/_apis/testplan/Plans/{planId}/suites?asTreeView=true&api-version=7.1");

        AddAuthorization(request, pat);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "Could not list suites for PlanId={PlanId} ({StatusCode}); falling back to the selected suite only.",
                planId,
                (int)response.StatusCode);
            return (new[] { suiteId }, null);
        }

        try
        {
            using var document = JsonDocument.Parse(body);
            if (!document.RootElement.TryGetProperty("value", out var values) || values.ValueKind != JsonValueKind.Array)
            {
                return (new[] { suiteId }, null);
            }

            var resolved = new HashSet<int>();
            foreach (var node in values.EnumerateArray())
            {
                if (TryCollectSubtree(node, suiteId, resolved))
                {
                    break;
                }
            }

            if (resolved.Count == 0)
            {
                // Fall back to the flat listing when the tree view does not expose the suite.
                var flat = await ResolveSuiteDescendantsFromFlatListAsync(
                    organization,
                    project,
                    planId,
                    suiteId,
                    pat,
                    cancellationToken);
                return (flat, null);
            }

            return (resolved.ToList(), null);
        }
        catch (JsonException)
        {
            return (new[] { suiteId }, null);
        }
    }

    private static bool TryCollectSubtree(JsonElement node, int targetSuiteId, HashSet<int> output)
    {
        if (TryReadInt(node, "id", out var id) && id == targetSuiteId)
        {
            CollectIds(node, output);
            return true;
        }

        if (node.TryGetProperty("children", out var children) && children.ValueKind == JsonValueKind.Array)
        {
            foreach (var child in children.EnumerateArray())
            {
                if (TryCollectSubtree(child, targetSuiteId, output))
                {
                    return true;
                }
            }
        }

        return false;

        static void CollectIds(JsonElement node, HashSet<int> output)
        {
            if (TryReadInt(node, "id", out var id))
            {
                output.Add(id);
            }

            if (node.TryGetProperty("children", out var children) && children.ValueKind == JsonValueKind.Array)
            {
                foreach (var child in children.EnumerateArray())
                {
                    CollectIds(child, output);
                }
            }
        }
    }

    private async Task<IReadOnlyList<int>> ResolveSuiteDescendantsFromFlatListAsync(
        string organization,
        string project,
        int planId,
        int suiteId,
        string pat,
        CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://dev.azure.com/{organization}/{Uri.EscapeDataString(project)}/_apis/testplan/Plans/{planId}/suites?api-version=7.1");

        AddAuthorization(request, pat);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return new[] { suiteId };
        }

        try
        {
            using var document = JsonDocument.Parse(body);
            if (!document.RootElement.TryGetProperty("value", out var values) || values.ValueKind != JsonValueKind.Array)
            {
                return new[] { suiteId };
            }

            var childrenByParent = new Dictionary<int, List<int>>();
            foreach (var suite in values.EnumerateArray())
            {
                if (!TryReadInt(suite, "id", out var currentId))
                {
                    continue;
                }

                if (!suite.TryGetProperty("parentSuite", out var parentSuite)
                    || !TryReadInt(parentSuite, "id", out var parentId))
                {
                    continue;
                }

                if (!childrenByParent.TryGetValue(parentId, out var children))
                {
                    children = new List<int>();
                    childrenByParent[parentId] = children;
                }

                children.Add(currentId);
            }

            var resolved = new HashSet<int> { suiteId };
            var pending = new Queue<int>();
            pending.Enqueue(suiteId);

            while (pending.Count > 0)
            {
                var current = pending.Dequeue();
                if (!childrenByParent.TryGetValue(current, out var children))
                {
                    continue;
                }

                foreach (var child in children)
                {
                    if (resolved.Add(child))
                    {
                        pending.Enqueue(child);
                    }
                }
            }

            return resolved.ToList();
        }
        catch (JsonException)
        {
            return new[] { suiteId };
        }
    }

    private static bool TryReadInt(JsonElement element, string propertyName, out int value)
    {
        value = 0;
        if (!element.TryGetProperty(propertyName, out var property))
        {
            return false;
        }

        return property.ValueKind switch
        {
            JsonValueKind.Number => property.TryGetInt32(out value),
            JsonValueKind.String => int.TryParse(property.GetString(), out value),
            _ => false,
        };
    }

    private async Task<(IReadOnlyList<int> Ids, string? Error)> QueryTestCaseIdsForSuiteAsync(
        string organization,
        string project,
        int planId,
        int suiteId,
        string pat,
        CancellationToken cancellationToken)
    {
        var baseUrl = $"https://dev.azure.com/{organization}/{Uri.EscapeDataString(project)}";

        // Organizations differ in which api-version/route they accept, so try the known variants.
        var candidateUrls = new[]
        {
            $"{baseUrl}/_apis/testplan/Plans/{planId}/Suites/{suiteId}/TestCase?api-version=7.1",
            $"{baseUrl}/_apis/testplan/Plans/{planId}/Suites/{suiteId}/TestCase?api-version=7.1-preview.3",
            $"{baseUrl}/_apis/test/Plans/{planId}/suites/{suiteId}/testcases?api-version=7.1",
            $"{baseUrl}/_apis/test/Plans/{planId}/suites/{suiteId}/testcases?api-version=5.0",
        };

        string? lastError = null;

        foreach (var url in candidateUrls)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            AddAuthorization(request, pat);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                lastError = $"Could not load test cases for suite ({(int)response.StatusCode}) from {url}: {Truncate(body)}";
                _logger.LogWarning("ADO suite test case request failed: {Error}", lastError);
                continue;
            }

            var parsed = ParseSuiteTestCaseIds(body);
            if (parsed.Count > 0)
            {
                _logger.LogDebug("ADO suite {SuiteId} resolved via {Url}", suiteId, url);
                return (parsed, null);
            }

            _logger.LogDebug(
                "ADO suite {SuiteId} returned no ids from {Url}. Body preview: {Body}",
                suiteId,
                url,
                Truncate(body));

            // A genuinely empty suite is a valid answer; stop probing further variants.
            return (Array.Empty<int>(), null);
        }

        return (Array.Empty<int>(), lastError ?? "Could not load test cases for the selected suite.");
    }

    private static string Truncate(string value) =>
        string.IsNullOrEmpty(value) || value.Length <= 400 ? value : value[..400] + "...";

    private static IReadOnlyList<int> ParseSuiteTestCaseIds(string body)
    {
        try
        {
            using var document = JsonDocument.Parse(body);
            if (!document.RootElement.TryGetProperty("value", out var values) || values.ValueKind != JsonValueKind.Array)
            {
                return Array.Empty<int>();
            }

            var ids = new HashSet<int>();
            foreach (var item in values.EnumerateArray())
            {
                // testplan API returns "workItem"; the legacy test API returns "testCase".
                if (item.TryGetProperty("workItem", out var workItem) && TryReadInt(workItem, "id", out var workItemId))
                {
                    ids.Add(workItemId);
                    continue;
                }

                if (item.TryGetProperty("testCase", out var testCase))
                {
                    if (TryReadInt(testCase, "id", out var testCaseId))
                    {
                        ids.Add(testCaseId);
                    }

                    continue;
                }

                if (TryReadInt(item, "id", out var itemId))
                {
                    ids.Add(itemId);
                }
            }

            return ids.ToList();
        }
        catch (JsonException)
        {
            return Array.Empty<int>();
        }
    }

    public async Task<AdoPublishTestCasesResponse> PublishTestCasesAsync(AdoPublishTestCasesRequest request, CancellationToken cancellationToken)
    {
        var organization = string.IsNullOrWhiteSpace(request.Organization)
            ? _options.Organization?.Trim() ?? string.Empty
            : request.Organization.Trim();

        var project = string.IsNullOrWhiteSpace(request.Project)
            ? _options.Project?.Trim() ?? string.Empty
            : request.Project.Trim();

        if (string.IsNullOrWhiteSpace(organization) || string.IsNullOrWhiteSpace(project))
        {
            return new AdoPublishTestCasesResponse
            {
                Success = false,
                Message = "An Azure DevOps organization and project are required.",
            };
        }

        var pat = ResolvePat(request.Pat);
        if (string.IsNullOrWhiteSpace(pat))
        {
            return new AdoPublishTestCasesResponse
            {
                Success = false,
                Message = "A personal access token is required to publish test cases.",
            };
        }

        if (request.TestCases.Count == 0)
        {
            return new AdoPublishTestCasesResponse
            {
                Success = false,
                Message = "No test cases were supplied to publish.",
            };
        }

        var results = new List<AdoPublishedTestCaseResult>();

        foreach (var testCase in request.TestCases)
        {
            var created = await CreateTestCaseWorkItemAsync(organization, project, pat, testCase, cancellationToken);
            results.Add(created);

            if (created.Success && !created.Updated && created.WorkItemId.HasValue && request.PlanId is > 0 && request.SuiteId is > 0)
            {
                await AddTestCaseToSuiteAsync(
                    organization,
                    project,
                    request.PlanId.Value,
                    request.SuiteId.Value,
                    created.WorkItemId.Value,
                    pat,
                    cancellationToken);
            }
        }

        var createdCount = results.Count(item => item.Success);
        var failedCount = results.Count - createdCount;

        _logger.LogInformation(
            "ADO publish completed. Project={Project} Created={Created} Failed={Failed}",
            project,
            createdCount,
            failedCount);

        return new AdoPublishTestCasesResponse
        {
            Success = createdCount > 0,
            CreatedCount = createdCount,
            FailedCount = failedCount,
            Results = results,
            Message = failedCount == 0
                ? $"{createdCount} test case(s) published to {project}."
                : results.Count == 1 && !string.IsNullOrWhiteSpace(results[0].Error)
                    ? results[0].Error!
                    : $"{createdCount} published, {failedCount} failed. See results for details.",
        };
    }

    private async Task<AdoPublishedTestCaseResult> CreateTestCaseWorkItemAsync(
        string organization,
        string project,
        string pat,
        AdoPublishTestCaseInput testCase,
        CancellationToken cancellationToken)
    {
        var title = testCase.Title?.Trim();
        if (string.IsNullOrWhiteSpace(title))
        {
            return new AdoPublishedTestCaseResult
            {
                Title = testCase.Title ?? string.Empty,
                Success = false,
                Error = "Title is required.",
            };
        }

        var patchDocument = new List<object>
        {
            new { op = "add", path = "/fields/System.Title", value = title },
        };

        // Updating an existing test case keeps its description; only title and steps are replaced.
        if (!(testCase.WorkItemId is > 0) && !string.IsNullOrWhiteSpace(testCase.Description))
        {
            patchDocument.Add(new { op = "add", path = "/fields/System.Description", value = ToHtml(testCase.Description) });
        }

        var steps = testCase.Steps
            .Where(step => !string.IsNullOrWhiteSpace(step.Action) || !string.IsNullOrWhiteSpace(step.Expected))
            .ToList();

        if (steps.Count > 0)
        {
            patchDocument.Add(new
            {
                op = "add",
                path = "/fields/Microsoft.VSTS.TCM.Steps",
                value = BuildStepsXml(steps),
            });
        }

        var priorityValue = MapPriority(testCase.Priority);
        if (priorityValue.HasValue)
        {
            patchDocument.Add(new { op = "add", path = "/fields/Microsoft.VSTS.Common.Priority", value = priorityValue.Value });
        }

        var existingId = testCase.WorkItemId is > 0 ? testCase.WorkItemId : null;
        if (existingId.HasValue)
        {
            var typeError = await VerifyExistingTestCaseAsync(organization, project, pat, existingId.Value, cancellationToken);
            if (typeError is not null)
            {
                return new AdoPublishedTestCaseResult { Title = title, Success = false, WorkItemId = existingId, Error = typeError };
            }
        }

        var request = new HttpRequestMessage(
            existingId.HasValue ? HttpMethod.Patch : HttpMethod.Post,
            existingId.HasValue
                ? $"https://dev.azure.com/{organization}/{Uri.EscapeDataString(project)}/_apis/wit/workitems/{existingId.Value}?api-version=7.1"
                : $"https://dev.azure.com/{organization}/{Uri.EscapeDataString(project)}/_apis/wit/workitems/$Test%20Case?api-version=7.1")
        {
            Content = new StringContent(
                JsonSerializer.Serialize(patchDocument),
                Encoding.UTF8,
                "application/json-patch+json"),
        };

        AddAuthorization(request, pat);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return new AdoPublishedTestCaseResult
            {
                Title = title,
                Success = false,
                WorkItemId = existingId,
                Error = existingId.HasValue
                    ? $"Could not update test case #{existingId.Value} ({(int)response.StatusCode}): {Truncate(body)}"
                    : $"Could not create test case ({(int)response.StatusCode}): {Truncate(body)}",
            };
        }

        try
        {
            using var document = JsonDocument.Parse(body);
            var root = document.RootElement;
            var workItemId = root.TryGetProperty("id", out var idElement) ? idElement.GetInt32() : (int?)null;
            var storedSteps = root.TryGetProperty("fields", out var createdFields)
                ? CountSteps(ReadString(createdFields, "Microsoft.VSTS.TCM.Steps"))
                : 0;

            string? error = workItemId.HasValue ? null : "Azure DevOps did not return a work item id.";
            if (workItemId.HasValue && storedSteps != steps.Count)
            {
                _logger.LogWarning(
                    "Work item {WorkItemId} stored {StoredSteps} of {SentSteps} test steps.",
                    workItemId,
                    storedSteps,
                    steps.Count);
                error = $"Azure DevOps stored {storedSteps} of {steps.Count} test steps.";
            }

            return new AdoPublishedTestCaseResult
            {
                Title = title,
                Success = workItemId.HasValue,
                WorkItemId = workItemId,
                StepCount = storedSteps,
                Error = error,
                Updated = existingId.HasValue,
            };
        }
        catch (JsonException exception)
        {
            return new AdoPublishedTestCaseResult
            {
                Title = title,
                Success = false,
                Error = $"Could not parse the created work item response: {exception.Message}",
            };
        }
    }

    // Confirms the target exists in this project and is a Test Case, so other work item types are never overwritten.
    private async Task<string?> VerifyExistingTestCaseAsync(
        string organization,
        string project,
        string pat,
        int workItemId,
        CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://dev.azure.com/{organization}/{Uri.EscapeDataString(project)}/_apis/wit/workitems/{workItemId}?fields=System.WorkItemType,System.TeamProject&api-version=7.1");
        AddAuthorization(request, pat);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return $"Work item #{workItemId} was not found in project {project}.";
        }

        if (!response.IsSuccessStatusCode)
        {
            return $"Could not read work item #{workItemId} ({(int)response.StatusCode}): {Truncate(body)}";
        }

        try
        {
            using var document = JsonDocument.Parse(body);
            var fields = document.RootElement.GetProperty("fields");
            var type = ReadString(fields, "System.WorkItemType");
            if (!string.Equals(type, "Test Case", StringComparison.OrdinalIgnoreCase))
            {
                return $"Work item #{workItemId} is a {(string.IsNullOrWhiteSpace(type) ? "non-Test Case item" : type)}, not a Test Case.";
            }

            var itemProject = ReadString(fields, "System.TeamProject");
            if (!string.IsNullOrWhiteSpace(itemProject) && !string.Equals(itemProject, project, StringComparison.OrdinalIgnoreCase))
            {
                return $"Work item #{workItemId} belongs to project {itemProject}, not {project}.";
            }
        }
        catch (Exception exception) when (exception is JsonException or KeyNotFoundException)
        {
            return $"Could not read work item #{workItemId}: {exception.Message}";
        }

        return null;
    }

    private async Task AddTestCaseToSuiteAsync(
        string organization,
        string project,
        int planId,
        int suiteId,
        int workItemId,
        string pat,
        CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"https://dev.azure.com/{organization}/{Uri.EscapeDataString(project)}/_apis/testplan/Plans/{planId}/Suites/{suiteId}/TestCase/{workItemId}?api-version=7.1");

        AddAuthorization(request, pat);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning(
                "Could not add work item {WorkItemId} to PlanId={PlanId} SuiteId={SuiteId} ({StatusCode}): {Body}",
                workItemId,
                planId,
                suiteId,
                (int)response.StatusCode,
                Truncate(body));
        }
    }

    // Builds Microsoft.VSTS.TCM.Steps in the same shape the Azure DevOps test case form saves:
    // step ids start at 2 and "last" is the highest id, steps with an expected result are
    // ValidateStep, each parameterizedString holds XML-escaped HTML (isformatted="true"),
    // and every step ends with an empty <description/>.
    internal static string BuildStepsXml(IReadOnlyList<AdoPublishStepInput> steps)
    {
        const int firstStepId = 2;
        var builder = new StringBuilder();
        builder.Append($"<steps id=\"0\" last=\"{firstStepId + steps.Count - 1}\">");

        for (var index = 0; index < steps.Count; index += 1)
        {
            var step = steps[index];
            var type = string.IsNullOrWhiteSpace(step.Expected) ? "ActionStep" : "ValidateStep";
            builder.Append($"<step id=\"{firstStepId + index}\" type=\"{type}\">");
            AppendParameterizedString(builder, step.Action);
            AppendParameterizedString(builder, step.Expected);
            builder.Append("<description/>");
            builder.Append("</step>");
        }

        builder.Append("</steps>");
        return builder.ToString();
    }

    private static void AppendParameterizedString(StringBuilder builder, string? text)
    {
        var html = string.IsNullOrWhiteSpace(text) ? string.Empty : $"<DIV><P>{EncodeLines(text)}</P></DIV>";
        builder.Append("<parameterizedString isformatted=\"true\">")
            .Append(System.Security.SecurityElement.Escape(html))
            .Append("</parameterizedString>");
    }

    private static string EncodeLines(string text) =>
        string.Join("<BR/>", text.Trim().Replace("\r\n", "\n").Split('\n').Select(System.Net.WebUtility.HtmlEncode));

    // System.Description is an HTML field; plain text would lose its line breaks.
    internal static string ToHtml(string text)
    {
        if (System.Text.RegularExpressions.Regex.IsMatch(text, "<(p|div|br|ol|ul|li)\\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
        {
            return text;
        }

        var paragraphs = System.Text.RegularExpressions.Regex.Split(text.Trim().Replace("\r\n", "\n"), "\n\\s*\n");
        return string.Concat(paragraphs.Select(paragraph => $"<p>{EncodeLines(paragraph)}</p>"));
    }

    private static int? MapPriority(string? priority) => priority?.Trim().ToLowerInvariant() switch
    {
        "high" => 1,
        "medium" => 2,
        "low" => 3,
        _ => null,
    };

    private async Task<(IReadOnlyList<AdoTestCaseSummary> Items, string? Error)> FetchTestCaseBatchAsync(
        string organization,
        string pat,
        IReadOnlyList<int> ids,
        CancellationToken cancellationToken)
    {
        const string fields =
            "System.Id,System.Title,System.AreaPath,System.IterationPath,System.State,Microsoft.VSTS.Common.Priority,Microsoft.VSTS.TCM.Steps";

        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://dev.azure.com/{organization}/_apis/wit/workitems?ids={string.Join(',', ids)}&fields={fields}&api-version=7.1-preview.3");

        AddAuthorization(request, pat);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return (Array.Empty<AdoTestCaseSummary>(), $"Could not read test case details ({(int)response.StatusCode}): {body}");
        }

        try
        {
            using var document = JsonDocument.Parse(body);
            if (!document.RootElement.TryGetProperty("value", out var values))
            {
                return (Array.Empty<AdoTestCaseSummary>(), null);
            }

            var items = new List<AdoTestCaseSummary>();
            foreach (var item in values.EnumerateArray())
            {
                if (!item.TryGetProperty("fields", out var itemFields))
                {
                    continue;
                }

                items.Add(new AdoTestCaseSummary
                {
                    Id = item.TryGetProperty("id", out var id) ? id.GetInt32() : 0,
                    Title = ReadString(itemFields, "System.Title"),
                    AreaPath = ReadString(itemFields, "System.AreaPath"),
                    IterationPath = ReadString(itemFields, "System.IterationPath"),
                    State = ReadString(itemFields, "System.State"),
                    Priority = itemFields.TryGetProperty("Microsoft.VSTS.Common.Priority", out var priority)
                        ? priority.ToString()
                        : null,
                    StepCount = CountSteps(ReadString(itemFields, "Microsoft.VSTS.TCM.Steps")),
                });
            }

            return (items, null);
        }
        catch (JsonException exception)
        {
            return (Array.Empty<AdoTestCaseSummary>(), $"Could not read test case details: {exception.Message}");
        }
    }

    private static void AddAuthorization(HttpRequestMessage request, string pat)
    {
        request.Headers.Authorization = new AuthenticationHeaderValue(
            "Basic",
            Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pat}")));
    }

    private static string ReadString(JsonElement fields, string name) =>
        fields.TryGetProperty(name, out var value) ? value.GetString() ?? string.Empty : string.Empty;

    // Steps are stored as an XML fragment; each <step> element is one action/expected pair.
    private static int CountSteps(string stepsXml) =>
        string.IsNullOrWhiteSpace(stepsXml)
            ? 0
            : System.Text.RegularExpressions.Regex.Matches(stepsXml, "<step\\b").Count;

    private static string EscapeWiql(string value) => value.Replace("'", "''");

    private string ResolvePat(string? overridePat)
    {
        if (!string.IsNullOrWhiteSpace(overridePat))
        {
            return overridePat;
        }

        if (!string.IsNullOrWhiteSpace(_options.Pat))
        {
            return _options.Pat;
        }

        var patFromStandardEnv = Environment.GetEnvironmentVariable("AZURE_DEVOPS_PAT");
        if (!string.IsNullOrWhiteSpace(patFromStandardEnv))
        {
            return patFromStandardEnv;
        }

        if (!string.IsNullOrWhiteSpace(_options.PatSecretName))
        {
            var patFromNamedEnv = Environment.GetEnvironmentVariable(_options.PatSecretName);
            if (!string.IsNullOrWhiteSpace(patFromNamedEnv))
            {
                return patFromNamedEnv;
            }
        }

        return string.Empty;
    }

    private static IReadOnlyList<string> ReadProjectNames(string json)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            if (!document.RootElement.TryGetProperty("value", out var values))
            {
                return Array.Empty<string>();
            }

            return values
                .EnumerateArray()
                .Select(item => item.TryGetProperty("name", out var name) ? name.GetString() : null)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Select(name => name!)
                .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
        catch (JsonException)
        {
            return Array.Empty<string>();
        }
    }

    private static IReadOnlyList<string> ReadAreaPaths(string json, string project)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            var paths = new List<string>();
            Collect(document.RootElement, project, paths);
            return paths.OrderBy(path => path, StringComparer.OrdinalIgnoreCase).ToList();
        }
        catch (JsonException)
        {
            return Array.Empty<string>();
        }

        // ADO reports "\Project\Area\Child"; the usable area path drops the "\Area" classifier segment.
        static void Collect(JsonElement node, string project, List<string> paths)
        {
            if (node.TryGetProperty("path", out var pathNode))
            {
                var raw = pathNode.GetString();
                if (!string.IsNullOrWhiteSpace(raw))
                {
                    var normalized = raw
                        .Replace($"\\{project}\\Area", project, StringComparison.OrdinalIgnoreCase)
                        .TrimStart('\\');

                    if (!paths.Contains(normalized, StringComparer.OrdinalIgnoreCase))
                    {
                        paths.Add(normalized);
                    }
                }
            }

            if (node.TryGetProperty("children", out var children) && children.ValueKind == JsonValueKind.Array)
            {
                foreach (var child in children.EnumerateArray())
                {
                    Collect(child, project, paths);
                }
            }
        }
    }

    private static string? TryReadProjectId(string json)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            if (document.RootElement.TryGetProperty("id", out var idNode))
            {
                return idNode.GetString();
            }
        }
        catch
        {
            return null;
        }

        return null;
    }

    private static IReadOnlyList<AdoTestNodeOption> ReadTestNodeOptions(string json)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            var results = new List<AdoTestNodeOption>();

            if (document.RootElement.TryGetProperty("value", out var values) && values.ValueKind == JsonValueKind.Array)
            {
                foreach (var node in values.EnumerateArray())
                {
                    Collect(node, results);
                }
            }

            return results
                .GroupBy(item => item.Id)
                .Select(group => group.First())
                .OrderBy(item => item.Name, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
        catch (JsonException)
        {
            return Array.Empty<AdoTestNodeOption>();
        }

        static void Collect(JsonElement node, List<AdoTestNodeOption> output)
        {
            var id = 0;
            var hasId = false;
            if (node.TryGetProperty("id", out var idNode))
            {
                if (idNode.ValueKind == JsonValueKind.Number)
                {
                    hasId = idNode.TryGetInt32(out id);
                }
                else if (idNode.ValueKind == JsonValueKind.String)
                {
                    hasId = int.TryParse(idNode.GetString(), out id);
                }
            }
            var hasName = node.TryGetProperty("name", out var nameNode);
            var name = hasName ? nameNode.GetString() : null;

            if (hasId && !string.IsNullOrWhiteSpace(name))
            {
                output.Add(new AdoTestNodeOption { Id = id, Name = name! });
            }

            if (node.TryGetProperty("children", out var children) && children.ValueKind == JsonValueKind.Array)
            {
                foreach (var child in children.EnumerateArray())
                {
                    Collect(child, output);
                }
            }
        }
    }
}
