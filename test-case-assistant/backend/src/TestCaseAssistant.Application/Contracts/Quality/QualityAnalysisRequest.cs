using System.ComponentModel.DataAnnotations;

namespace TestCaseAssistant.Application.Contracts.Quality;

public sealed class QualityAnalysisRequest
{
    [Required]
    public Guid WorkspaceId { get; set; }

    public List<Guid>? TestCaseIds { get; set; }
}
