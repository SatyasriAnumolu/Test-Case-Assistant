using System.ComponentModel.DataAnnotations;

namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class AdoProjectListRequest
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Organization { get; set; } = string.Empty;

    public string? Pat { get; set; }
}
