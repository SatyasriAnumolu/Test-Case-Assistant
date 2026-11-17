-- Test Case Assistant baseline schema
-- SQL Server / Azure SQL

CREATE TABLE Workspaces (
    WorkspaceId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    AzureDevOpsOrg NVARCHAR(200) NOT NULL,
    AzureProjectId NVARCHAR(200) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE TestCases (
    TestCaseId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    WorkspaceId UNIQUEIDENTIFIER NOT NULL,
    ExternalId NVARCHAR(100) NOT NULL,
    Title NVARCHAR(500) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Priority NVARCHAR(50) NULL,
    State NVARCHAR(50) NULL,
    SourceLastUpdatedAt DATETIME2 NULL,
    HashFingerprint VARBINARY(32) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_TestCases_Workspaces FOREIGN KEY (WorkspaceId) REFERENCES Workspaces(WorkspaceId)
);

CREATE UNIQUE INDEX UX_TestCases_Workspace_ExternalId ON TestCases(WorkspaceId, ExternalId);
CREATE INDEX IX_TestCases_Workspace_UpdatedAt ON TestCases(WorkspaceId, UpdatedAt DESC);

CREATE TABLE TestCaseSteps (
    StepId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    TestCaseId UNIQUEIDENTIFIER NOT NULL,
    StepOrder INT NOT NULL,
    ActionText NVARCHAR(MAX) NOT NULL,
    ExpectedResultText NVARCHAR(MAX) NULL,
    IsGenerated BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_TestCaseSteps_TestCases FOREIGN KEY (TestCaseId) REFERENCES TestCases(TestCaseId)
);

CREATE TABLE ImportJobs (
    ImportJobId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    WorkspaceId UNIQUEIDENTIFIER NOT NULL,
    Status NVARCHAR(30) NOT NULL,
    StartedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CompletedAt DATETIME2 NULL,
    SummaryJson NVARCHAR(MAX) NULL,
    CONSTRAINT FK_ImportJobs_Workspaces FOREIGN KEY (WorkspaceId) REFERENCES Workspaces(WorkspaceId)
);

CREATE TABLE GenerationRequests (
    GenerationRequestId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    WorkspaceId UNIQUEIDENTIFIER NOT NULL,
    TestCaseId UNIQUEIDENTIFIER NULL,
    RequestType NVARCHAR(40) NOT NULL,
    Status NVARCHAR(30) NOT NULL,
    InputSnapshotJson NVARCHAR(MAX) NOT NULL,
    OutputJson NVARCHAR(MAX) NULL,
    ModelName NVARCHAR(200) NULL,
    PromptVersion NVARCHAR(50) NULL,
    Confidence DECIMAL(5,4) NULL,
    CreatedBy NVARCHAR(200) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_GenerationRequests_Workspaces FOREIGN KEY (WorkspaceId) REFERENCES Workspaces(WorkspaceId),
    CONSTRAINT FK_GenerationRequests_TestCases FOREIGN KEY (TestCaseId) REFERENCES TestCases(TestCaseId)
);

CREATE TABLE DuplicateRuns (
    DuplicateRunId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    WorkspaceId UNIQUEIDENTIFIER NOT NULL,
    Status NVARCHAR(30) NOT NULL,
    SimilarityThreshold DECIMAL(5,4) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_DuplicateRuns_Workspaces FOREIGN KEY (WorkspaceId) REFERENCES Workspaces(WorkspaceId)
);

CREATE TABLE DuplicatePairs (
    PairId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    DuplicateRunId UNIQUEIDENTIFIER NOT NULL,
    TestCaseIdA UNIQUEIDENTIFIER NOT NULL,
    TestCaseIdB UNIQUEIDENTIFIER NOT NULL,
    SimilarityScore DECIMAL(5,4) NOT NULL,
    DecisionStatus NVARCHAR(30) NOT NULL DEFAULT 'Pending',
    CONSTRAINT FK_DuplicatePairs_DuplicateRuns FOREIGN KEY (DuplicateRunId) REFERENCES DuplicateRuns(DuplicateRunId),
    CONSTRAINT FK_DuplicatePairs_TestCaseA FOREIGN KEY (TestCaseIdA) REFERENCES TestCases(TestCaseId),
    CONSTRAINT FK_DuplicatePairs_TestCaseB FOREIGN KEY (TestCaseIdB) REFERENCES TestCases(TestCaseId)
);

CREATE INDEX IX_DuplicatePairs_Run_Score ON DuplicatePairs(DuplicateRunId, SimilarityScore DESC);

CREATE TABLE QualityAnalyses (
    QualityAnalysisId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    WorkspaceId UNIQUEIDENTIFIER NOT NULL,
    Status NVARCHAR(30) NOT NULL,
    RulesVersion NVARCHAR(40) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_QualityAnalyses_Workspaces FOREIGN KEY (WorkspaceId) REFERENCES Workspaces(WorkspaceId)
);

CREATE TABLE QualityResults (
    QualityResultId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    QualityAnalysisId UNIQUEIDENTIFIER NOT NULL,
    TestCaseId UNIQUEIDENTIFIER NOT NULL,
    OverallScore DECIMAL(5,2) NOT NULL,
    DimensionScoresJson NVARCHAR(MAX) NOT NULL,
    FindingsJson NVARCHAR(MAX) NULL,
    CONSTRAINT FK_QualityResults_Analyses FOREIGN KEY (QualityAnalysisId) REFERENCES QualityAnalyses(QualityAnalysisId),
    CONSTRAINT FK_QualityResults_TestCases FOREIGN KEY (TestCaseId) REFERENCES TestCases(TestCaseId)
);

CREATE TABLE CoverageAnalyses (
    CoverageAnalysisId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    WorkspaceId UNIQUEIDENTIFIER NOT NULL,
    Status NVARCHAR(30) NOT NULL,
    RequirementSourceVersion NVARCHAR(100) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_CoverageAnalyses_Workspaces FOREIGN KEY (WorkspaceId) REFERENCES Workspaces(WorkspaceId)
);

CREATE TABLE CoverageGaps (
    CoverageGapId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    CoverageAnalysisId UNIQUEIDENTIFIER NOT NULL,
    RequirementId NVARCHAR(100) NOT NULL,
    GapType NVARCHAR(50) NOT NULL,
    Severity NVARCHAR(20) NOT NULL,
    SuggestedTestsJson NVARCHAR(MAX) NULL,
    CONSTRAINT FK_CoverageGaps_Analyses FOREIGN KEY (CoverageAnalysisId) REFERENCES CoverageAnalyses(CoverageAnalysisId)
);

CREATE TABLE CleanupJobs (
    CleanupJobId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    WorkspaceId UNIQUEIDENTIFIER NOT NULL,
    Status NVARCHAR(30) NOT NULL,
    ProposedChangesJson NVARCHAR(MAX) NOT NULL,
    ApprovedBy NVARCHAR(200) NULL,
    ApprovedAt DATETIME2 NULL,
    RolledBackAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_CleanupJobs_Workspaces FOREIGN KEY (WorkspaceId) REFERENCES Workspaces(WorkspaceId)
);

CREATE TABLE AuditEvents (
    AuditEventId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    WorkspaceId UNIQUEIDENTIFIER NOT NULL,
    ActorId NVARCHAR(200) NOT NULL,
    ActionType NVARCHAR(80) NOT NULL,
    EntityType NVARCHAR(80) NOT NULL,
    EntityId NVARCHAR(100) NOT NULL,
    BeforeJson NVARCHAR(MAX) NULL,
    AfterJson NVARCHAR(MAX) NULL,
    CorrelationId NVARCHAR(100) NOT NULL,
    OccurredAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_AuditEvents_Workspaces FOREIGN KEY (WorkspaceId) REFERENCES Workspaces(WorkspaceId)
);

CREATE INDEX IX_AuditEvents_Workspace_OccurredAt ON AuditEvents(WorkspaceId, OccurredAt DESC);
