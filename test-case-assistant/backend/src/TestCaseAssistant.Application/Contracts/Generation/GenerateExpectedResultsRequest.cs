using System.ComponentModel.DataAnnotations;

namespace TestCaseAssistant.Application.Contracts.Generation;

public sealed class GenerateExpectedResultsRequest
{
    [Required]
    public Guid WorkspaceId { get; set; }

    [Required]
    public Guid TestCaseId { get; set; }

    [Required]
    [MinLength(1)]
    public List<string> Steps { get; set; } = [];
}
