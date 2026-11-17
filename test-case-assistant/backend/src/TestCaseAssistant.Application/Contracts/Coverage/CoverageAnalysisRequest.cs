using System.ComponentModel.DataAnnotations;

namespace TestCaseAssistant.Application.Contracts.Coverage;

public sealed class CoverageAnalysisRequest
{
    [Required]
    public Guid WorkspaceId { get; set; }

    [Required]
    [RegularExpression("^(UserStories|BRD|Backlog)$")]
    public string RequirementSource { get; set; } = "UserStories";
}
