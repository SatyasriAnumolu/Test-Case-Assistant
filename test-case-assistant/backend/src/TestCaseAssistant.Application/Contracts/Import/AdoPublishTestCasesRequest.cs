using System.ComponentModel.DataAnnotations;

namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class AdoPublishStepInput
{
    public string Action { get; set; } = string.Empty;
    public string Expected { get; set; } = string.Empty;
}

public sealed class AdoPublishTestCaseInput
{
    [Required]
    [StringLength(400, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? Priority { get; set; }

    public IReadOnlyList<AdoPublishStepInput> Steps { get; set; } = Array.Empty<AdoPublishStepInput>();

    // When set, this existing Test Case work item is updated instead of creating a new one.
    public int? WorkItemId { get; set; }
}

public sealed class AdoPublishTestCasesRequest
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Organization { get; set; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Project { get; set; } = string.Empty;

    public string? Pat { get; set; }

    // Optional: when both are set, published test cases are also added to this suite.
    public int? PlanId { get; set; }

    public int? SuiteId { get; set; }

    [Required]
    [MinLength(1)]
    public List<AdoPublishTestCaseInput> TestCases { get; set; } = new();
}
