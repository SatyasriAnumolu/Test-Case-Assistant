namespace TestCaseAssistant.Domain.Entities;

public sealed class TestCaseEntity
{
    public Guid TestCaseId { get; set; } = Guid.NewGuid();
    public string ExternalId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal QualityScore { get; set; }
}
