using Microsoft.EntityFrameworkCore;
using TestCaseAssistant.Application.Abstractions;
using TestCaseAssistant.Domain.Entities;

namespace TestCaseAssistant.Infrastructure.Persistence;

public sealed class EfTestCaseRepository : ITestCaseRepository
{
    private readonly TestCaseAssistantDbContext _dbContext;

    public EfTestCaseRepository(TestCaseAssistantDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<TestCaseEntity>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.TestCases
            .OrderBy(x => x.ExternalId)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(TestCaseEntity entity, CancellationToken cancellationToken)
    {
        _dbContext.TestCases.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
