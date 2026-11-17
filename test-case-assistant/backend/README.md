# Test Case Assistant Backend

## Running locally

The frontend requires the API at `http://localhost:5000`. Building the solution
does not start the API. Keep both the frontend and API running while using the app.

In VS Code, use **Tasks: Run Task** and select **Run Test Case Assistant** to
start the API first, wait for it to listen on port 5000, and then start the frontend.
If the frontend is already running, select **Run Test Case Assistant API** instead.
Keep the API task terminal open. If it is closed or terminated, the frontend cannot
load projects even though its page still opens.

Alternatively, in a VS Code terminal at the workspace root, run the following
command and leave that terminal running:

```powershell
dotnet run --project ".\test-case-assistant\backend\src\TestCaseAssistant.Api\TestCaseAssistant.Api.csproj" -- --urls http://localhost:5000 --environment Development
```

If project discovery reports that the backend cannot be reached, start the API
and use **Retry project list** on the Azure DevOps connection page. Credentials
do not need to be cleared. Azure DevOps authentication or permission errors are
reported separately after the API receives the request.

## Projects
- TestCaseAssistant.Api: .NET 8 Web API host.
- TestCaseAssistant.Application: application interfaces and use-case orchestration.
- TestCaseAssistant.Domain: domain entities and rules.
- TestCaseAssistant.Infrastructure: persistence and external integrations.
- TestCaseAssistant.Worker: background job processor for AI and bulk tasks.

## Next Steps
1. Replace in-memory repository with EF Core SQL implementation.
2. Add Azure DevOps REST and Azure OpenAI adapters in Infrastructure.
3. Add auth middleware for Entra ID scopes and roles.
4. Align controllers to architecture/openapi/test-case-assistant.v1.yaml.
