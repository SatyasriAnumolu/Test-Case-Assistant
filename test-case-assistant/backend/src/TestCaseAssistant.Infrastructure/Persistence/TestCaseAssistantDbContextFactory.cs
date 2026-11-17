using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TestCaseAssistant.Infrastructure.Persistence;

public sealed class TestCaseAssistantDbContextFactory : IDesignTimeDbContextFactory<TestCaseAssistantDbContext>
{
    public TestCaseAssistantDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<TestCaseAssistantDbContext>();
        optionsBuilder.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=TestCaseAssistantDb;Trusted_Connection=True;TrustServerCertificate=True;");
        return new TestCaseAssistantDbContext(optionsBuilder.Options);
    }
}
