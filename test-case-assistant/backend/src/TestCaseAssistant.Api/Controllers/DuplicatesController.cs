using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCaseAssistant.Api.Authorization;
using TestCaseAssistant.Application.Abstractions;
using TestCaseAssistant.Application.Contracts.Common;
using TestCaseAssistant.Application.Contracts.Duplicates;

namespace TestCaseAssistant.Api.Controllers;

[ApiController]
[Route("api/v1/duplicates")]
[Authorize(Policy = AuthorizationPolicies.Reviewer)]
public sealed class DuplicatesController : ControllerBase
{
    private readonly IDuplicateDetectionService _duplicateDetectionService;

    public DuplicatesController(IDuplicateDetectionService duplicateDetectionService)
    {
        _duplicateDetectionService = duplicateDetectionService;
    }

    [HttpPost("analyze")]
    public async Task<IActionResult> Analyze([FromBody] DuplicateAnalysisRequest request, CancellationToken cancellationToken)
    {
        var runId = await _duplicateDetectionService.AnalyzeAsync(request, cancellationToken);
        return Accepted(new JobAcceptedResponse { JobId = runId, Status = "Accepted" });
    }

    [HttpGet("groups")]
    public async Task<IActionResult> GetGroups([FromQuery] Guid runId, CancellationToken cancellationToken)
    {
        var response = await _duplicateDetectionService.GetGroupsAsync(runId, cancellationToken);
        if (response is null)
        {
            return NotFound(new OperationResultResponse
            {
                Success = false,
                Message = $"No duplicate analysis found for runId '{runId}'.",
            });
        }

        return Ok(response);
    }
}
