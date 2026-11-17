namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class AdoProjectListResponse
{
    public bool Success { get; set; }
    public string Organization { get; set; } = string.Empty;
    public IReadOnlyList<string> Projects { get; set; } = Array.Empty<string>();
    public string Message { get; set; } = string.Empty;
}
