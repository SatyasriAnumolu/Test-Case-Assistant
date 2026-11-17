using TestCaseAssistant.Application.Contracts.Duplicates;

namespace TestCaseAssistant.Application.Abstractions;

public interface IDuplicateRunStore
{
    void Save(Guid runId, DuplicateGroupsResponse response);
    bool TryGet(Guid runId, out DuplicateGroupsResponse? response);
}
