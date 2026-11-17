using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCaseAssistant.Api.Authorization;
using TestCaseAssistant.Application.Contracts.Generation;

namespace TestCaseAssistant.Api.Controllers;

[ApiController]
[Route("api/v1/generation")]
[Authorize(Policy = AuthorizationPolicies.Editor)]
public sealed class GenerationController : ControllerBase
{
    [HttpPost("steps")]
    public IActionResult GenerateSteps([FromBody] GenerateStepsRequest request)
    {
        return Ok(new GenerateStepsResponse
        {
            TestCaseId = request.TestCaseId,
            Confidence = 0.84m,
            Steps =
            [
                new GeneratedStepResponse { Order = 1, Action = "Open application" },
                new GeneratedStepResponse { Order = 2, Action = "Perform action based on description" },
            ],
        });
    }

    [HttpPost("expected-results")]
    public IActionResult GenerateExpectedResults([FromBody] GenerateExpectedResultsRequest request)
    {
        return Ok(new GenerateExpectedResultsResponse
        {
            TestCaseId = request.TestCaseId,
            Confidence = 0.81m,
            ExpectedResults = request.Steps.Select((x, i) => $"Expected result {i + 1}: {x}").ToList(),
        });
    }
}
