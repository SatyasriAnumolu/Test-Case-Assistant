namespace TestCaseAssistant.Application.Contracts.Common;

public sealed class OperationResultResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}
