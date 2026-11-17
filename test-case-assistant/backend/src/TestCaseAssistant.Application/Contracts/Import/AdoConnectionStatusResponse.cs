namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class AdoConnectionStatusResponse
{
    public bool Success { get; set; }
    public string Organization { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ProjectId { get; set; }
    public string? ConnectedUser { get; set; }
    public IReadOnlyList<string> Projects { get; set; } = Array.Empty<string>();
}
