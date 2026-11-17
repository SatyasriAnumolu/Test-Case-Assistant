using System.ComponentModel.DataAnnotations;

namespace TestCaseAssistant.Application.Contracts.TestCases;

public sealed class CreateTestCaseRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string ExternalId { get; set; } = string.Empty;

    [Required]
    [StringLength(500, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MinLength(10)]
    public string Description { get; set; } = string.Empty;

    [Range(0, 100)]
    public decimal QualityScore { get; set; }
}
