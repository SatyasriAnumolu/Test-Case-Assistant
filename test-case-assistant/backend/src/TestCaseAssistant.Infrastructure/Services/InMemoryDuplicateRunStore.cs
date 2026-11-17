using System.Collections.Concurrent;
using TestCaseAssistant.Application.Abstractions;
using TestCaseAssistant.Application.Contracts.Duplicates;

namespace TestCaseAssistant.Infrastructure.Services;

public sealed class InMemoryDuplicateRunStore : IDuplicateRunStore
{
    private readonly ConcurrentDictionary<Guid, DuplicateGroupsResponse> _runs = new();

    public void Save(Guid runId, DuplicateGroupsResponse response)
    {
        _runs[runId] = response;
    }

    public bool TryGet(Guid runId, out DuplicateGroupsResponse? response)
    {
        var found = _runs.TryGetValue(runId, out var stored);
        response = stored;
        return found;
    }
}
