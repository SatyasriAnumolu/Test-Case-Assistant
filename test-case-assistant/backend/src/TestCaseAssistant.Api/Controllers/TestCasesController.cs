using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCaseAssistant.Api.Authorization;
using TestCaseAssistant.Application.Abstractions;
using TestCaseAssistant.Application.Contracts.TestCases;
using TestCaseAssistant.Domain.Entities;

namespace TestCaseAssistant.Api.Controllers;

[ApiController]
[Route("api/v1/testcases")]
[Authorize(Policy = AuthorizationPolicies.Reader)]
public sealed class TestCasesController : ControllerBase
{
    private readonly ITestCaseRepository _repository;

    public TestCasesController(ITestCaseRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.Reader)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _repository.GetAllAsync(cancellationToken);
        var response = result
            .Select(x => new TestCaseResponse
            {
                TestCaseId = x.TestCaseId,
                ExternalId = x.ExternalId,
                Title = x.Title,
                Description = x.Description,
                QualityScore = x.QualityScore,
            })
            .ToList();

        return Ok(response);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.Editor)]
    public async Task<IActionResult> Create([FromBody] CreateTestCaseRequest request, CancellationToken cancellationToken)
    {
        var entity = new TestCaseEntity
        {
            ExternalId = request.ExternalId,
            Title = request.Title,
            Description = request.Description,
            QualityScore = request.QualityScore,
        };

        await _repository.AddAsync(entity, cancellationToken);

        var response = new TestCaseResponse
        {
            TestCaseId = entity.TestCaseId,
            ExternalId = entity.ExternalId,
            Title = entity.Title,
            Description = entity.Description,
            QualityScore = entity.QualityScore,
        };

        return CreatedAtAction(nameof(GetAll), new { id = response.TestCaseId }, response);
    }
}
