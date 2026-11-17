using System.ComponentModel.DataAnnotations;

namespace TestCaseAssistant.Application.Contracts.Generation;

public sealed class GenerateStepsRequest
{
    [Required]
    public Guid WorkspaceId { get; set; }

    [Required]
    public Guid TestCaseId { get; set; }

    [Required]
    [MinLength(10)]
    public string Description { get; set; } = string.Empty;
}
