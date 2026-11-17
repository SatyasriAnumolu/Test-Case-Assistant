namespace TestCaseAssistant.Application.Contracts.Duplicates;

public sealed class DuplicateGroupsResponse
{
    public Guid RunId { get; set; }
    public List<DuplicateGroupResponse> Groups { get; set; } = [];
}
