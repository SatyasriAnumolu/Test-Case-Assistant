using System.ComponentModel.DataAnnotations;

namespace TestCaseAssistant.Application.Contracts.Cleanup;

public sealed class CleanupRequest
{
    [Required]
    public Guid WorkspaceId { get; set; }

    [Required]
    [RegularExpression("^(NormalizeTitles|RemoveDuplicates|RegenerateExpectedResults)$")]
    public string Action { get; set; } = "NormalizeTitles";

    public List<Guid>? TargetTestCaseIds { get; set; }
}
