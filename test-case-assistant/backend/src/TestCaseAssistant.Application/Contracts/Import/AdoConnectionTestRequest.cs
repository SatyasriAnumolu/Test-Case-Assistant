using System.ComponentModel.DataAnnotations;

namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class AdoConnectionTestRequest
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Organization { get; set; } = string.Empty;

    [StringLength(200, MinimumLength = 2)]
    public string? Project { get; set; }

    public string? Pat { get; set; }
}
