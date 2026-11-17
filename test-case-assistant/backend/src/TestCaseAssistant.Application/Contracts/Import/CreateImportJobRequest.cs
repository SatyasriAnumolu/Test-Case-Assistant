using System.ComponentModel.DataAnnotations;

namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class CreateImportJobRequest
{
    [Required]
    public Guid WorkspaceId { get; set; }

    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string AzureProjectId { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int? TestPlanId { get; set; }

    [Range(1, int.MaxValue)]
    public int? TestSuiteId { get; set; }
}
