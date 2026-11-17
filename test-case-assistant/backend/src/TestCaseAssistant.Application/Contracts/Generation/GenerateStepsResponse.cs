namespace TestCaseAssistant.Application.Contracts.Generation;

public sealed class GenerateStepsResponse
{
    public Guid TestCaseId { get; set; }
    public List<GeneratedStepResponse> Steps { get; set; } = [];
    public decimal Confidence { get; set; }
}
