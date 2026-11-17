using System.ComponentModel.DataAnnotations;

namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class AdoAreaPathListRequest
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Organization { get; set; } = string.Empty;

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Project { get; set; } = string.Empty;

    public string? Pat { get; set; }
}
