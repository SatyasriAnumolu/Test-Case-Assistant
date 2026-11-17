using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCaseAssistant.Api.Authorization;
using TestCaseAssistant.Application.Abstractions;
using TestCaseAssistant.Application.Contracts.Common;
using TestCaseAssistant.Application.Contracts.Import;

namespace TestCaseAssistant.Api.Controllers;

[ApiController]
[Route("api/v1/import")]
[Authorize(Policy = AuthorizationPolicies.Editor)]
public sealed class ImportController : ControllerBase
{
    private readonly IAzureDevOpsConnectionService _azureDevOpsConnectionService;

    public ImportController(IAzureDevOpsConnectionService azureDevOpsConnectionService)
    {
        _azureDevOpsConnectionService = azureDevOpsConnectionService;
    }

    [HttpPost("jobs")]
    public IActionResult CreateJob([FromBody] CreateImportJobRequest request)
    {
        return Accepted(new JobAcceptedResponse { JobId = Guid.NewGuid(), Status = "Accepted" });
    }

    [HttpGet("ado-connection-test")]
    [AllowAnonymous]
    public async Task<IActionResult> TestAdoConnection(CancellationToken cancellationToken)
    {
        var result = await _azureDevOpsConnectionService.CheckConnectionAsync(cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("ado-connection-test")]
    [AllowAnonymous]
    public async Task<IActionResult> TestAdoConnectionFromRequest([FromBody] AdoConnectionTestRequest request, CancellationToken cancellationToken)
    {
        var result = await _azureDevOpsConnectionService.CheckConnectionAsync(
            request.Organization,
            request.Project,
            request.Pat,
            cancellationToken);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("ado-projects")]
    [AllowAnonymous]
    public async Task<IActionResult> ListAdoProjects([FromBody] AdoProjectListRequest request, CancellationToken cancellationToken)
    {
        var result = await _azureDevOpsConnectionService.ListProjectsAsync(
            request.Organization,
            request.Pat,
            cancellationToken);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("ado-area-paths")]
    [AllowAnonymous]
    public async Task<IActionResult> ListAdoAreaPaths([FromBody] AdoAreaPathListRequest request, CancellationToken cancellationToken)
    {
        var result = await _azureDevOpsConnectionService.ListAreaPathsAsync(
            request.Organization,
            request.Project,
            request.Pat,
            cancellationToken);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("ado-test-plans")]
    [AllowAnonymous]
    public async Task<IActionResult> ListAdoTestPlans([FromBody] AdoTestPlanListRequest request, CancellationToken cancellationToken)
    {
        var result = await _azureDevOpsConnectionService.ListTestPlansAsync(
            request.Organization,
            request.Project,
            request.AreaPaths,
            request.Pat,
            cancellationToken);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("ado-test-suites")]
    [AllowAnonymous]
    public async Task<IActionResult> ListAdoTestSuites([FromBody] AdoTestSuiteListRequest request, CancellationToken cancellationToken)
    {
        var result = await _azureDevOpsConnectionService.ListTestSuitesAsync(
            request.Organization,
            request.Project,
            request.PlanId,
            request.Pat,
            cancellationToken);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("ado-sync")]
    [AllowAnonymous]
    public async Task<IActionResult> SyncAdoTestCases([FromBody] AdoSyncTestCasesRequest request, CancellationToken cancellationToken)
    {
        var result = await _azureDevOpsConnectionService.SyncTestCasesAsync(request, cancellationToken);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("ado-publish-test-cases")]
    [AllowAnonymous]
    public async Task<IActionResult> PublishAdoTestCases([FromBody] AdoPublishTestCasesRequest request, CancellationToken cancellationToken)
    {
        var result = await _azureDevOpsConnectionService.PublishTestCasesAsync(request, cancellationToken);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpGet("jobs/{jobId:guid}")]
    public IActionResult GetJobStatus(Guid jobId)
    {
        return Ok(new ImportJobStatusResponse
        {
            JobId = jobId,
            Status = "Running",
            ImportedCount = 0,
            FailedCount = 0,
        });
    }
}
