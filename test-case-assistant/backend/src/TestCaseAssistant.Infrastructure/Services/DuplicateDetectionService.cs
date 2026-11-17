using TestCaseAssistant.Application.Abstractions;
using TestCaseAssistant.Application.Contracts.Duplicates;
using TestCaseAssistant.Domain.Entities;

namespace TestCaseAssistant.Infrastructure.Services;

public sealed class DuplicateDetectionService : IDuplicateDetectionService
{
    private readonly ITestCaseRepository _testCaseRepository;
    private readonly IDuplicateRunStore _runStore;

    public DuplicateDetectionService(ITestCaseRepository testCaseRepository, IDuplicateRunStore runStore)
    {
        _testCaseRepository = testCaseRepository;
        _runStore = runStore;
    }

    public async Task<Guid> AnalyzeAsync(DuplicateAnalysisRequest request, CancellationToken cancellationToken)
    {
        var runId = Guid.NewGuid();
        var testCases = await _testCaseRepository.GetAllAsync(cancellationToken);

        var threshold = request.SimilarityThreshold;
        var pairs = BuildCandidatePairs(testCases, threshold);
        var groups = BuildGroups(testCases, pairs);

        var response = new DuplicateGroupsResponse
        {
            RunId = runId,
            Groups = groups,
        };

        _runStore.Save(runId, response);
        return runId;
    }

    public Task<DuplicateGroupsResponse?> GetGroupsAsync(Guid runId, CancellationToken cancellationToken)
    {
        _runStore.TryGet(runId, out var response);
        return Task.FromResult(response);
    }

    private static List<(int LeftIndex, int RightIndex, decimal Score)> BuildCandidatePairs(
        IReadOnlyList<TestCaseEntity> testCases,
        decimal threshold)
    {
        var pairs = new List<(int LeftIndex, int RightIndex, decimal Score)>();

        for (var i = 0; i < testCases.Count; i++)
        {
            for (var j = i + 1; j < testCases.Count; j++)
            {
                var score = CalculateSimilarity(testCases[i], testCases[j]);
                if (score >= threshold)
                {
                    pairs.Add((i, j, score));
                }
            }
        }

        return pairs;
    }

    private static List<DuplicateGroupResponse> BuildGroups(
        IReadOnlyList<TestCaseEntity> testCases,
        IReadOnlyList<(int LeftIndex, int RightIndex, decimal Score)> pairs)
    {
        if (pairs.Count == 0)
        {
            return [];
        }

        var parent = Enumerable.Range(0, testCases.Count).ToArray();

        foreach (var pair in pairs)
        {
            Union(parent, pair.LeftIndex, pair.RightIndex);
        }

        var membersByRoot = new Dictionary<int, List<int>>();
        foreach (var index in Enumerable.Range(0, testCases.Count))
        {
            var root = Find(parent, index);
            if (!membersByRoot.TryGetValue(root, out var list))
            {
                list = [];
                membersByRoot[root] = list;
            }

            list.Add(index);
        }

        var scoreByRoot = new Dictionary<int, decimal>();
        foreach (var pair in pairs)
        {
            var root = Find(parent, pair.LeftIndex);
            if (!scoreByRoot.TryGetValue(root, out var max) || pair.Score > max)
            {
                scoreByRoot[root] = pair.Score;
            }
        }

        return membersByRoot
            .Where(x => x.Value.Count > 1)
            .Select(x => new DuplicateGroupResponse
            {
                GroupId = Guid.NewGuid(),
                MaxSimilarityScore = scoreByRoot.TryGetValue(x.Key, out var score) ? score : 0m,
                Members = x.Value
                    .Select(index => string.IsNullOrWhiteSpace(testCases[index].ExternalId)
                        ? testCases[index].TestCaseId.ToString()
                        : testCases[index].ExternalId)
                    .ToList(),
            })
            .OrderByDescending(x => x.MaxSimilarityScore)
            .ToList();
    }

    private static decimal CalculateSimilarity(TestCaseEntity left, TestCaseEntity right)
    {
        var leftTokens = Tokenize($"{left.Title} {left.Description}");
        var rightTokens = Tokenize($"{right.Title} {right.Description}");

        if (leftTokens.Count == 0 || rightTokens.Count == 0)
        {
            return 0m;
        }

        var intersection = leftTokens.Intersect(rightTokens).Count();
        var union = leftTokens.Union(rightTokens).Count();

        return union == 0 ? 0m : (decimal)intersection / union;
    }

    private static HashSet<string> Tokenize(string input)
    {
        var normalized = new string(input
            .ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : ' ')
            .ToArray());

        return normalized
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet();
    }

    private static int Find(int[] parent, int x)
    {
        if (parent[x] != x)
        {
            parent[x] = Find(parent, parent[x]);
        }

        return parent[x];
    }

    private static void Union(int[] parent, int x, int y)
    {
        var rootX = Find(parent, x);
        var rootY = Find(parent, y);

        if (rootX != rootY)
        {
            parent[rootY] = rootX;
        }
    }
}
