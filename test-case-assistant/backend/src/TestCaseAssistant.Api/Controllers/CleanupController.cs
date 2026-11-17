using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCaseAssistant.Api.Authorization;
using TestCaseAssistant.Application.Contracts.Cleanup;
using TestCaseAssistant.Application.Contracts.Common;

namespace TestCaseAssistant.Api.Controllers;

[ApiController]
[Route("api/v1/cleanup")]
[Authorize(Policy = AuthorizationPolicies.Admin)]
public sealed class CleanupController : ControllerBase
{
    [HttpPost("jobs")]
    public IActionResult CreateJob([FromBody] CleanupRequest request)
    {
        return Accepted(new JobAcceptedResponse { JobId = Guid.NewGuid(), Status = "Accepted" });
    }

    [HttpPost("jobs/{jobId:guid}/approve")]
    public IActionResult Approve(Guid jobId)
    {
        return Ok(new OperationResultResponse
        {
            Success = true,
            Message = $"Cleanup job {jobId} approved.",
        });
    }
}
