using TestCaseAssistant.Domain.Entities;

namespace TestCaseAssistant.Application.Abstractions;

public interface ITestCaseRepository
{
    Task<IReadOnlyList<TestCaseEntity>> GetAllAsync(CancellationToken cancellationToken);
    Task AddAsync(TestCaseEntity entity, CancellationToken cancellationToken);
}
