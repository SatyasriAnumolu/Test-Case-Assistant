using System.ComponentModel.DataAnnotations;

namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class AdoTestSuiteListRequest
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Organization { get; set; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Project { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int PlanId { get; set; }

    public string? Pat { get; set; }
}
