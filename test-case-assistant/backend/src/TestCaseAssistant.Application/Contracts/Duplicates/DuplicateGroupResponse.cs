namespace TestCaseAssistant.Application.Contracts.Duplicates;

public sealed class DuplicateGroupResponse
{
    public Guid GroupId { get; set; }
    public decimal MaxSimilarityScore { get; set; }
    public List<string> Members { get; set; } = [];
}
