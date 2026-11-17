using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCaseAssistant.Api.Authorization;
using TestCaseAssistant.Application.Contracts.Reports;

namespace TestCaseAssistant.Api.Controllers;

[ApiController]
[Route("api/v1/reports")]
[Authorize(Policy = AuthorizationPolicies.Reader)]
public sealed class ReportsController : ControllerBase
{
    [HttpGet("dashboard")]
    public IActionResult GetDashboard([FromQuery] Guid workspaceId)
    {
        return Ok(new DashboardReportResponse
        {
            WorkspaceId = workspaceId,
            TotalTestCases = 120,
            AverageQualityScore = 81.2m,
            DuplicateRate = 0.12m,
            UncoveredRequirementCount = 8,
        });
    }
}
