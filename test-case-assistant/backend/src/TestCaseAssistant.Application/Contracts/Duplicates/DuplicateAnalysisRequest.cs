using System.ComponentModel.DataAnnotations;

namespace TestCaseAssistant.Application.Contracts.Duplicates;

public sealed class DuplicateAnalysisRequest
{
    [Required]
    public Guid WorkspaceId { get; set; }

    [Range(0.50, 0.99)]
    public decimal SimilarityThreshold { get; set; } = 0.85m;
}
