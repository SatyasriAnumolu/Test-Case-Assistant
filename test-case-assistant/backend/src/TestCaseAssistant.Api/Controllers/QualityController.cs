using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCaseAssistant.Api.Authorization;
using TestCaseAssistant.Application.Contracts.Common;
using TestCaseAssistant.Application.Contracts.Quality;

namespace TestCaseAssistant.Api.Controllers;

[ApiController]
[Route("api/v1/quality")]
[Authorize(Policy = AuthorizationPolicies.Reviewer)]
public sealed class QualityController : ControllerBase
{
    [HttpPost("analyze")]
    public IActionResult Analyze([FromBody] QualityAnalysisRequest request)
    {
        return Accepted(new JobAcceptedResponse { JobId = Guid.NewGuid(), Status = "Accepted" });
    }

    [HttpGet("results/{analysisId:guid}")]
    public IActionResult GetResults(Guid analysisId)
    {
        return Ok(new QualityResultsResponse
        {
            AnalysisId = analysisId,
            Results =
            [
                new QualityResultResponse
                {
                    TestCaseId = Guid.NewGuid(),
                    OverallScore = 82.4m,
                    Findings =
                    [
                        new QualityFindingResponse
                        {
                            RuleId = "Q-001",
                            Severity = "Medium",
                            Message = "Missing expected result detail",
                            SuggestedFix = "Add measurable expected output.",
                        },
                    ],
                },
            ],
        });
    }
}
