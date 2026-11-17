namespace TestCaseAssistant.Infrastructure.Services;

public sealed class AzureDevOpsOptions
{
    public string Organization { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public string? Pat { get; set; }
    public string? PatSecretName { get; set; }
}
