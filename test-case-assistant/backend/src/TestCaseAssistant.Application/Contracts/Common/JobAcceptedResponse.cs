namespace TestCaseAssistant.Application.Contracts.Common;

public sealed class JobAcceptedResponse
{
    public Guid JobId { get; set; }
    public string Status { get; set; } = "Accepted";
}
