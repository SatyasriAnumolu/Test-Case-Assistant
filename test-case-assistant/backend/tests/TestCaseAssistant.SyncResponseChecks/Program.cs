using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TestCaseAssistant.Application.Contracts.Import;
using TestCaseAssistant.Infrastructure.Services;

using (var client = new HttpClient(new OrganizationConnectionHandler()))
{
    var service = new AzureDevOpsConnectionService(
        client, Options.Create(new AzureDevOpsOptions()), NullLogger<AzureDevOpsConnectionService>.Instance);
    var result = await service.CheckConnectionAsync(
        "test-organization", null, "test-only-placeholder", CancellationToken.None);

    if (!result.Success
        || result.Organization != "test-organization"
        || result.Project.Length != 0
        || result.Projects.SequenceEqual(new[] { "Project One", "Project Two" }) is false
        || result.ConnectedUser != "Test User")
    {
        throw new InvalidOperationException("Organization-only connection did not return the projects and authenticated user.");
    }

    Console.WriteLine("PASS: organization/PAT connection loads projects before project selection");
}

using (var client = new HttpClient(new ProjectConnectionHandler()))
{
    var service = new AzureDevOpsConnectionService(
        client, Options.Create(new AzureDevOpsOptions()), NullLogger<AzureDevOpsConnectionService>.Instance);
    var result = await service.CheckConnectionAsync(
        "test-organization", "test-project", "test-only-placeholder", CancellationToken.None);

    if (!result.Success || result.Project != "test-project" || result.ConnectedUser != "Test User")
    {
        throw new InvalidOperationException("Project connection test did not preserve the explicit PAT session.");
    }

    Console.WriteLine("PASS: project connection test uses Basic base64(:PAT)");
}

foreach (var statusCode in new[]
{
    HttpStatusCode.Unauthorized,
    HttpStatusCode.Forbidden,
    HttpStatusCode.NotFound,
    HttpStatusCode.InternalServerError,
})
{
    using var client = new HttpClient(new AreaPathResponseHandler(statusCode));
    var service = new AzureDevOpsConnectionService(
        client, Options.Create(new AzureDevOpsOptions()), NullLogger<AzureDevOpsConnectionService>.Instance);
    var result = await service.ListAreaPathsAsync(
        "test-organization", "test-project", "test-only-placeholder", CancellationToken.None);
    var expectedReason = statusCode switch
    {
        HttpStatusCode.Unauthorized => "Authentication failed",
        HttpStatusCode.Forbidden => "Permission denied",
        HttpStatusCode.NotFound => "not found",
        _ => "server error",
    };

    if (result.Success
        || result.ApiStatusCode != (int)statusCode
        || result.ApiVersion != "7.1"
        || result.ApiUrl?.Contains("/_apis/wit/classificationnodes/areas?", StringComparison.Ordinal) != true
        || result.ApiResponseBody?.Contains("Access denied", StringComparison.Ordinal) != true
        || !result.ApiResponseHeaders.TryGetValue("X-TFS-Session", out var areaPathSession)
        || areaPathSession != "test-area-path-session"
        || result.ApiResponseHeaders.ContainsKey("Set-Cookie")
        || !result.Message.Contains(((int)statusCode).ToString(), StringComparison.Ordinal)
        || !result.Message.Contains(expectedReason, StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException($"Area Path HTTP {(int)statusCode} diagnostics were not preserved.");
    }

    Console.WriteLine($"PASS: Area Path HTTP {(int)statusCode} preserves status, URL, version, and body");
}

foreach (var statusCode in new[]
{
    HttpStatusCode.Unauthorized,
    HttpStatusCode.Forbidden,
    HttpStatusCode.NotFound,
    HttpStatusCode.InternalServerError,
})
{
    using var client = new HttpClient(new TestPlansResponseHandler(statusCode));
    var service = new AzureDevOpsConnectionService(
        client, Options.Create(new AzureDevOpsOptions()), NullLogger<AzureDevOpsConnectionService>.Instance);
    var result = await service.ListTestPlansAsync(
        "test-organization", "test-project", Array.Empty<string>(), "test-only-placeholder", CancellationToken.None);
    var expectedReason = statusCode switch
    {
        HttpStatusCode.Unauthorized => "Authentication failed",
        HttpStatusCode.Forbidden => "Permission denied",
        HttpStatusCode.NotFound => "not found",
        _ => "server error",
    };

    if (result.Success
        || result.ApiStatusCode != (int)statusCode
        || result.ApiVersion != "7.1"
        || result.ApiUrl?.Contains("/_apis/testplan/plans?api-version=7.1", StringComparison.Ordinal) != true
        || result.ApiResponseBody?.Contains("Access denied", StringComparison.Ordinal) != true
        || !result.ApiResponseHeaders.TryGetValue("X-TFS-Session", out var testPlanSession)
        || testPlanSession != "test-test-plan-session"
        || result.ApiResponseHeaders.ContainsKey("Set-Cookie")
        || !result.Message.Contains(((int)statusCode).ToString(), StringComparison.Ordinal)
        || !result.Message.Contains(expectedReason, StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException($"Test Plans HTTP {(int)statusCode} diagnostics were not preserved.");
    }

    Console.WriteLine($"PASS: Test Plans HTTP {(int)statusCode} preserves status, URL, version, and body");
}

var checks = new[]
{
    (Name: "HTML success", Status: HttpStatusCode.OK, MediaType: "text/html", Body: "\r\n<html>Sign in</html>", Success: false, Message: "returned HTML"),
    (Name: "Mislabeled HTML", Status: HttpStatusCode.OK, MediaType: "application/json", Body: "\r\n<html>Sign in</html>", Success: false, Message: "returned HTML"),
    (Name: "HTML proxy failure", Status: HttpStatusCode.BadGateway, MediaType: "text/html", Body: "<html>Proxy error</html>", Success: false, Message: "HTTP 502"),
    (Name: "Conditional Access", Status: HttpStatusCode.Forbidden, MediaType: "application/json", Body: "{\"message\":\"VS403463\"}", Success: false, Message: "Conditional Access"),
    (Name: "Valid empty query", Status: HttpStatusCode.OK, MediaType: "application/json", Body: "{\"workItems\":[]}", Success: true, Message: "0 test cases imported"),
    (Name: "JSON authorization failure", Status: HttpStatusCode.Unauthorized, MediaType: "application/json", Body: "{\"message\":\"Unauthorized\"}", Success: false, Message: "Test case query failed (401)"),
};

foreach (var check in checks)
{
    using var client = new HttpClient(new QueryHandler(check.Status, check.Body, check.MediaType));
    var service = new AzureDevOpsConnectionService(
        client, Options.Create(new AzureDevOpsOptions()), NullLogger<AzureDevOpsConnectionService>.Instance);
    var result = await service.SyncTestCasesAsync(new AdoSyncTestCasesRequest
    {
        Organization = "test-organization",
        Project = "test-project",
        Pat = "test-only-placeholder",
    }, CancellationToken.None);

    if (result.Success != check.Success || !result.Message.Contains(check.Message, StringComparison.Ordinal))
    {
        throw new InvalidOperationException($"{check.Name}: unexpected result: {result.Success}, {result.Message}");
    }

    Console.WriteLine($"PASS: {check.Name}");
}

var organizationChecks = new[]
{
    (Name: "Organization slug", Input: "contoso"),
    (Name: "Azure DevOps URL", Input: "https://dev.azure.com/contoso/MyProject"),
    (Name: "Legacy Azure DevOps URL", Input: "https://contoso.visualstudio.com/MyProject"),
};

foreach (var check in organizationChecks)
{
    var handler = new ProjectListHandler();
    using var client = new HttpClient(handler);
    var service = new AzureDevOpsConnectionService(
        client, Options.Create(new AzureDevOpsOptions()), NullLogger<AzureDevOpsConnectionService>.Instance);
    var result = await service.ListProjectsAsync(check.Input, "test-only-placeholder", CancellationToken.None);

    if (!result.Success
        || handler.RequestUri?.AbsolutePath != "/contoso/_apis/projects"
        || !result.Projects.Contains("Project One", StringComparer.Ordinal))
    {
        throw new InvalidOperationException($"{check.Name}: unexpected project-list request or response.");
    }

    Console.WriteLine($"PASS: {check.Name} normalized for project discovery");
}

using (var client = new HttpClient(new OversizedQueryHandler()))
{
    var service = new AzureDevOpsConnectionService(
        client, Options.Create(new AzureDevOpsOptions()), NullLogger<AzureDevOpsConnectionService>.Instance);
    var result = await service.SyncTestCasesAsync(new AdoSyncTestCasesRequest
    {
        Organization = "test-organization",
        Project = "test-project",
        Pat = "test-only-placeholder",
    }, CancellationToken.None);

    if (!result.Success
        || result.ImportedCount != 2
        || result.TestCases.Select(testCase => testCase.Id).Order().SequenceEqual(new[] { 100, 2_000_000_000 }) is false)
    {
        throw new InvalidOperationException($"Oversized WIQL query: unexpected result: {result.Success}, {result.Message}");
    }

    Console.WriteLine("PASS: WIQL query split after VS402337");
}

var concurrentHandler = new ConcurrentDetailHandler();
using (var client = new HttpClient(concurrentHandler))
{
    var service = new AzureDevOpsConnectionService(
        client, Options.Create(new AzureDevOpsOptions()), NullLogger<AzureDevOpsConnectionService>.Instance);
    var result = await service.SyncTestCasesAsync(new AdoSyncTestCasesRequest
    {
        Organization = "test-organization",
        Project = "test-project",
        Pat = "test-only-placeholder",
    }, CancellationToken.None);

    if (!result.Success || result.ImportedCount != 1_200
        || concurrentHandler.MaxConcurrentDetails < 2
        || concurrentHandler.MaxConcurrentDetails > 6)
    {
        throw new InvalidOperationException(
            $"Concurrent detail fetching: returned {result.ImportedCount}; max concurrent {concurrentHandler.MaxConcurrentDetails}.");
    }

    Console.WriteLine($"PASS: detail requests bounded at 6 (observed {concurrentHandler.MaxConcurrentDetails} concurrent)");
}

sealed class QueryHandler(HttpStatusCode status, string body, string mediaType) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (request.Method != HttpMethod.Post
            || request.RequestUri?.AbsolutePath.EndsWith("/_apis/wit/wiql", StringComparison.Ordinal) != true
            || !request.Headers.Accept.Any(value => value.MediaType == "application/json")
            || !request.Headers.TryGetValues("X-TFS-FedAuthRedirect", out var values)
            || !values.Contains("Suppress"))
        {
            throw new InvalidOperationException("Unexpected query request or missing response negotiation headers.");
        }

        return Task.FromResult(new HttpResponseMessage(status)
        {
            Content = new StringContent(body, Encoding.UTF8, mediaType),
        });
    }
}

sealed class ConcurrentDetailHandler : HttpMessageHandler
{
    private int _activeDetails;
    private int _maxConcurrentDetails;

    public int MaxConcurrentDetails => _maxConcurrentDetails;

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (request.Method == HttpMethod.Post
            && request.RequestUri?.AbsolutePath.EndsWith("/_apis/wit/wiql", StringComparison.Ordinal) == true)
        {
            var workItems = Enumerable.Range(1, 1_200).Select(id => new { id });
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(new { workItems }), Encoding.UTF8, "application/json"),
            };
        }

        if (request.Method == HttpMethod.Get
            && request.RequestUri?.AbsolutePath.EndsWith("/_apis/wit/workitems", StringComparison.Ordinal) == true)
        {
            var active = Interlocked.Increment(ref _activeDetails);
            UpdateMaximum(active);
            try
            {
                await Task.Delay(20, cancellationToken);
                var ids = request.RequestUri.Query
                    .Split("ids=", StringSplitOptions.None)[1]
                    .Split('&')[0]
                    .Split(',')
                    .Select(int.Parse);
                var items = ids.Select(id => new
                {
                    id,
                    fields = new
                    {
                        SystemTitle = $"Test case {id}",
                    },
                });

                // The fake response includes only fields the parser consumes for this test.
                var json = JsonSerializer.Serialize(new
                {
                    value = items.Select(item => new
                    {
                        item.id,
                        fields = new Dictionary<string, string> { ["System.Title"] = item.fields.SystemTitle },
                    }),
                });
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json"),
                };
            }
            finally
            {
                Interlocked.Decrement(ref _activeDetails);
            }
        }

        throw new InvalidOperationException($"Unexpected request: {request.Method} {request.RequestUri}");
    }

    private void UpdateMaximum(int active)
    {
        int current;
        do
        {
            current = _maxConcurrentDetails;
            if (active <= current) return;
        }
        while (Interlocked.CompareExchange(ref _maxConcurrentDetails, active, current) != current);
    }
}

sealed class ProjectListHandler : HttpMessageHandler
{
    public Uri? RequestUri { get; private set; }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var authorization = request.Headers.Authorization;
        if (authorization?.Scheme != "Basic"
            || Encoding.ASCII.GetString(Convert.FromBase64String(authorization.Parameter ?? string.Empty)) != ":test-only-placeholder")
        {
            throw new InvalidOperationException("Project list request did not use the expected Basic base64(:PAT) authorization.");
        }

        RequestUri = request.RequestUri;
        return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"value\":[{\"name\":\"Project One\"}]}", Encoding.UTF8, "application/json"),
        });
    }
}

sealed class OrganizationConnectionHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var authorization = request.Headers.Authorization;
        if (authorization?.Scheme != "Basic"
            || Encoding.ASCII.GetString(Convert.FromBase64String(authorization.Parameter ?? string.Empty)) != ":test-only-placeholder")
        {
            throw new InvalidOperationException("Organization connection request did not use the expected Basic base64(:PAT) authorization.");
        }

        if (request.RequestUri?.AbsolutePath.EndsWith("/_apis/projects", StringComparison.Ordinal) == true)
        {
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    "{\"value\":[{\"name\":\"Project Two\"},{\"name\":\"Project One\"}]}",
                    Encoding.UTF8,
                    "application/json"),
            });
        }

        if (request.RequestUri?.AbsolutePath.EndsWith("/_apis/connectionData", StringComparison.Ordinal) == true)
        {
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    "{\"authenticatedUser\":{\"providerDisplayName\":\"Test User\"}}",
                    Encoding.UTF8,
                    "application/json"),
            });
        }

        throw new InvalidOperationException($"Unexpected organization connection request: {request.Method} {request.RequestUri}");
    }
}

sealed class ProjectConnectionHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var authorization = request.Headers.Authorization;
        if (authorization?.Scheme != "Basic"
            || Encoding.ASCII.GetString(Convert.FromBase64String(authorization.Parameter ?? string.Empty)) != ":test-only-placeholder")
        {
            throw new InvalidOperationException("Project connection test did not use the expected Basic base64(:PAT) authorization.");
        }

        if (request.RequestUri?.AbsolutePath.EndsWith("/_apis/projects/test-project", StringComparison.Ordinal) == true)
        {
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"id\":\"test-project-id\"}", Encoding.UTF8, "application/json"),
            });
        }

        if (request.RequestUri?.AbsolutePath.EndsWith("/_apis/connectionData", StringComparison.Ordinal) == true)
        {
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    "{\"authenticatedUser\":{\"providerDisplayName\":\"Test User\"}}",
                    Encoding.UTF8,
                    "application/json"),
            });
        }

        throw new InvalidOperationException($"Unexpected project connection request: {request.Method} {request.RequestUri}");
    }
}

sealed class AreaPathResponseHandler(HttpStatusCode statusCode) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var authorization = request.Headers.Authorization;
        if (request.RequestUri?.AbsolutePath.EndsWith("/_apis/wit/classificationnodes/areas", StringComparison.Ordinal) != true
            || authorization?.Scheme != "Basic"
            || Encoding.ASCII.GetString(Convert.FromBase64String(authorization.Parameter ?? string.Empty)) != ":test-only-placeholder")
        {
            throw new InvalidOperationException($"Unexpected Area Path request: {request.Method} {request.RequestUri}");
        }

        var response = new HttpResponseMessage(statusCode)
        {
            Content = new StringContent("<html>Access denied</html>", Encoding.UTF8, "text/html"),
        };
        response.Headers.Add("X-TFS-Session", "test-area-path-session");
        response.Headers.Add("Set-Cookie", "test-session=do-not-log");
        return Task.FromResult(response);
    }
}

sealed class TestPlansResponseHandler(HttpStatusCode statusCode) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var authorization = request.Headers.Authorization;
        if (request.RequestUri?.AbsolutePath.EndsWith("/_apis/testplan/plans", StringComparison.Ordinal) != true
            || request.RequestUri.Query != "?api-version=7.1"
            || authorization?.Scheme != "Basic"
            || Encoding.ASCII.GetString(Convert.FromBase64String(authorization.Parameter ?? string.Empty)) != ":test-only-placeholder")
        {
            throw new InvalidOperationException($"Unexpected Test Plans request: {request.Method} {request.RequestUri}");
        }

        var response = new HttpResponseMessage(statusCode)
        {
            Content = new StringContent("<html>Access denied</html>", Encoding.UTF8, "text/html"),
        };
        response.Headers.Add("X-TFS-Session", "test-test-plan-session");
        response.Headers.Add("Set-Cookie", "test-session=do-not-log");
        return Task.FromResult(response);
    }
}

sealed class OversizedQueryHandler : HttpMessageHandler
{
    private static readonly int[] TestCaseIds = [100, 2_000_000_000];

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (request.Method == HttpMethod.Post
            && request.RequestUri?.AbsolutePath.EndsWith("/_apis/wit/wiql", StringComparison.Ordinal) == true)
        {
            using var queryDocument = JsonDocument.Parse(await request.Content!.ReadAsStringAsync(cancellationToken));
            var wiql = queryDocument.RootElement.GetProperty("query").GetString() ?? string.Empty;
            var range = Regex.Match(wiql, @"\[System\.Id\] >= (?<minimum>\d+) AND \[System\.Id\] <= (?<maximum>\d+)");
            if (!range.Success)
            {
                throw new InvalidOperationException("WIQL query is missing its work item ID range.");
            }

            var minimumId = int.Parse(range.Groups["minimum"].Value);
            var maximumId = int.Parse(range.Groups["maximum"].Value);
            var matchingIds = TestCaseIds.Where(id => id >= minimumId && id <= maximumId).ToArray();
            if (matchingIds.Length == TestCaseIds.Length)
            {
                return new HttpResponseMessage(HttpStatusCode.BadRequest)
                {
                    Content = new StringContent("{\"message\":\"VS402337: More than 20,000 work items.\"}", Encoding.UTF8, "application/json"),
                };
            }

            var queryResponse = JsonSerializer.Serialize(new
            {
                workItems = matchingIds.Select(id => new { id }),
            });
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(queryResponse, Encoding.UTF8, "application/json"),
            };
        }

        if (request.Method == HttpMethod.Get
            && request.RequestUri?.AbsolutePath.EndsWith("/_apis/wit/workitems", StringComparison.Ordinal) == true)
        {
            const string details = "{\"value\":[{\"id\":100,\"fields\":{\"System.Title\":\"Test case 100\",\"System.AreaPath\":\"test-project\",\"System.IterationPath\":\"test-project\",\"System.State\":\"Active\"}},{\"id\":2000000000,\"fields\":{\"System.Title\":\"Test case 2000000000\",\"System.AreaPath\":\"test-project\",\"System.IterationPath\":\"test-project\",\"System.State\":\"Active\"}}]}";
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(details, Encoding.UTF8, "application/json"),
            };
        }

        throw new InvalidOperationException($"Unexpected request: {request.Method} {request.RequestUri}");
    }
}