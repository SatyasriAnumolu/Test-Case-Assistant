namespace TestCaseAssistant.Application.Contracts.Import;

public sealed class AdoAreaPathListResponse
{
    public bool Success { get; set; }
    public string Organization { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public IReadOnlyList<string> AreaPaths { get; set; } = Array.Empty<string>();
    public string Message { get; set; } = string.Empty;
    public int? ApiStatusCode { get; set; }
    public string? ApiUrl { get; set; }
    public string? ApiVersion { get; set; }
    public string? ApiResponseBody { get; set; }
    public IReadOnlyDictionary<string, string> ApiResponseHeaders { get; set; } = new Dictionary<string, string>();
}
