using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCaseAssistant.Api.Authorization;
using TestCaseAssistant.Application.Contracts.Common;
using TestCaseAssistant.Application.Contracts.Coverage;

namespace TestCaseAssistant.Api.Controllers;

[ApiController]
[Route("api/v1/coverage")]
[Authorize(Policy = AuthorizationPolicies.Reviewer)]
public sealed class CoverageController : ControllerBase
{
    [HttpPost("analyze")]
    public IActionResult Analyze([FromBody] CoverageAnalysisRequest request)
    {
        return Accepted(new JobAcceptedResponse { JobId = Guid.NewGuid(), Status = "Accepted" });
    }
}
