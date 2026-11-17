using System.ComponentModel.DataAnnotations;

namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class AdoTestPlanListRequest
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Organization { get; set; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Project { get; set; } = string.Empty;

    public IReadOnlyList<string> AreaPaths { get; set; } = Array.Empty<string>();

    public string? Pat { get; set; }
}
