using Microsoft.EntityFrameworkCore;
using TestCaseAssistant.Domain.Entities;

namespace TestCaseAssistant.Infrastructure.Persistence;

public sealed class TestCaseAssistantDbContext : DbContext
{
    public TestCaseAssistantDbContext(DbContextOptions<TestCaseAssistantDbContext> options)
        : base(options)
    {
    }

    public DbSet<TestCaseEntity> TestCases => Set<TestCaseEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TestCaseEntity>(entity =>
        {
            entity.ToTable("TestCases");
            entity.HasKey(x => x.TestCaseId);
            entity.Property(x => x.ExternalId).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Title).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Description).HasColumnType("nvarchar(max)");
            entity.Property(x => x.QualityScore).HasColumnType("decimal(5,2)");
        });
    }
}
