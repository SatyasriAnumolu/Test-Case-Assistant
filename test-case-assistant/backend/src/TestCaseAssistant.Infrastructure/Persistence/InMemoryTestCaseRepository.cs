using TestCaseAssistant.Application.Abstractions;
using TestCaseAssistant.Domain.Entities;

namespace TestCaseAssistant.Infrastructure.Persistence;

public sealed class InMemoryTestCaseRepository : ITestCaseRepository
{
    private readonly List<TestCaseEntity> _store =
    [
        new TestCaseEntity { ExternalId = "TC001", Title = "Login with valid credentials", Description = "Verify successful login.", QualityScore = 82 },
        new TestCaseEntity { ExternalId = "TC002", Title = "Account lockout after invalid attempts", Description = "Verify lockout policy.", QualityScore = 76 }
    ];

    public Task<IReadOnlyList<TestCaseEntity>> GetAllAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult<IReadOnlyList<TestCaseEntity>>(_store);
    }

    public Task AddAsync(TestCaseEntity entity, CancellationToken cancellationToken)
    {
        _store.Add(entity);
        return Task.CompletedTask;
    }
}
