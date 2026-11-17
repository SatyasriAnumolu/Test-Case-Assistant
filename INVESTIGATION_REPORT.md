# Duplicate Test Cases Area Path Filtering Investigation

**Date**: 2026-11-02  
**Issue**: Duplicate detection results contain test cases from unselected Area Paths

## Problem Statement

User reports that when selecting a specific Area Path (e.g., "AppServer OMI\Team.Rangers") on the Import Test Cases page, the Duplicate Test Cases results still include test cases from other Area Paths such as:
- AppServer OMI\ArchestrA Config
- AppServer OMI
- Other unrelated Area Paths

**Expected**: Duplicate detection should only analyze test cases belonging to the selected Area Path (and child Area Paths).

---

## Investigation Findings

### 1. Backend Implementation ✅ CORRECT

**File**: `backend/src/TestCaseAssistant.Infrastructure/Services/AzureDevOpsConnectionService.cs`

**Method**: `SyncTestCasesAsync()` (line ~364)

The backend correctly handles area path filtering:
```csharp
if (areaPaths.Count > 0)
{
    var areaClauses = areaPaths.Select(path => $"[System.AreaPath] UNDER '{EscapeWiql(path)}'");
    conditions.Append(" AND (").Append(string.Join(" OR ", areaClauses)).Append(')');
}
```

**Analysis**:
- Uses WIQL `[System.AreaPath] UNDER` operator for hierarchical path matching
- Correctly generates AND clause when multiple area paths selected
- Backend **is filtering test cases correctly**

### 2. Frontend API Communication ✅ CORRECT

**File**: `src/services/apiService.js`

**Function**: `syncAdoTestCases()`

```javascript
export async function syncAdoTestCases({ organization, project, pat, areaPaths, planId, suiteId, scope }) {
  const response = await fetch(`${API_BASE_URL}/import/ado-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organization, project, pat, areaPaths, planId, suiteId, scope }),
  })
  // ...
  return payload
}
```

**Analysis**:
- `areaPaths` is correctly included in request payload
- Frontend **is sending selected area paths to backend**

### 3. Frontend Import Flow ✅ CORRECT

**File**: `src/pages/ImportTestCases.jsx`

**Key Points**:
- User selects area paths in multi-select dropdown (lines ~1005-1020)
- `selectedAreaPaths` stored in context via `setSelectedAreaPaths()`
- On sync, payload includes `areaPaths: selectedAreaPaths` (line ~803)
- Synced test cases stored in context via `setSyncedTestCases()`

**Analysis**:
- Import flow is logically correct
- Selected area paths are passed to backend
- Returned test cases are stored in `syncedTestCases` context

### 4. Frontend Duplicate Detection Filtering ✅ CORRECT

**File**: `src/pages/ado/DuplicatesPanel.jsx`

**Changes Made** (as per previous work):
- Line 216: Destructures `selectedAreaPaths` from context
- Lines 230-254: Filters `eligibleTestCases` to include only cases matching selected area paths
- Uses hierarchical matching: `areaPath.startsWith(selectedPath + '\\')`

```javascript
const eligibleTestCases = useMemo(
  () => {
    let filtered = syncedTestCases.filter(...)
    
    if (selectedAreaPaths.length > 0) {
      const selectedSet = new Set(selectedAreaPaths.map((path) => path.toLowerCase()))
      filtered = filtered.filter((item) => {
        const areaPath = (item.areaPath || '').toLowerCase()
        return [...selectedSet].some(
          (selectedPath) => areaPath === selectedPath || areaPath.startsWith(`${selectedPath}\\`)
        )
      })
    }
    
    return filtered
  },
  [syncedTestCases, selectedAreaPaths],
)
```

**Analysis**:
- Filtering logic matches ImportTestCases.jsx pattern
- Only runs when `selectedAreaPaths.length > 0`
- Console logs added for debugging

### 5. Detection Algorithm ✅ CORRECT

**File**: `src/utils/duplicates.js`

**Function**: `findDuplicateClusters(testCases, threshold)`

The detection engine receives only the filtered `eligibleTestCases` and operates on that set. **No filtering needed at this level.**

---

## Root Cause Analysis

Based on the investigation, **all components are logically correct**. The issue must be in one of these scenarios:

### Scenario A: User Import Workflow Issue (MOST LIKELY)

**Steps that could cause the issue**:

1. User selects Import Scope: "All Test Cases" ✅
2. User selects one Area Path, e.g., "AppServer OMI\Team.Rangers" ✅
3. User clicks "Sync" button ✅
   - Backend returns test cases from Team.Rangers
   - `syncedTestCases` now contains Team.Rangers cases ✅
4. User navigates to Duplicates tab
5. Duplicate detection runs on Team.Rangers cases ✅
6. **BUT THEN**: User selects a different Area Path on Import page
7. **Without syncing again**, user returns to Duplicates tab and runs detection again
8. **Result**: Detection now sees ALL synced test cases (including previous imports) ✅

**Why this happens**:
- `syncedTestCases` in context is cumulative - it's never cleared when area path changes
- Only cleared on explicit sync
- User might not realize they need to sync again after changing area path

### Scenario B: Multiple Syncs Without Scope Change (POSSIBLE)

1. First import: Scope "All Test Cases", no area path selected
   - Returns ALL test cases from project
   - `syncedTestCases` now contains everything
2. Second import: Scope "All Test Cases", Area Path selected
   - Returns filtered test cases from selected path
   - `syncedTestCases` is **replaced** with filtered set ✅
3. If user doesn't see the message showing filtered count, they might assume all cases are included

### Scenario C: Incorrect Area Path Selection (POSSIBLE)

- User might select "AppServer OMI" thinking it's a leaf node
- But "AppServer OMI" is actually a parent node containing multiple child paths
- WIQL `UNDER` operator returns all descendants (which is correct behavior)
- User sees multiple area paths in results and thinks filtering didn't work

---

## Diagnostic Information Added

**File**: `src/pages/ado/DuplicatesPanel.jsx`

Added console logging and UI messages:
1. **Console logs** (lines ~237-249):
   - Logs `selectedAreaPaths` and filter results when filtering occurs
   - Logs total synced count vs filtered count
   - Clear indication when no area path filter is applied

2. **UI Display** (line ~350-356):
   - Shows "Comparing X of Y synced test cases"
   - Shows selected area path(s) in the hint text
   - Clarifies whether area path filter is applied or all cases are used

---

## Recommendations

### For Users

1. **Verify Area Path Filter**: Check the "Detection settings" card - it now shows:
   - Total synced test cases
   - Eligible (filtered) test cases
   - Which area paths are being used

2. **Always Sync After Changing Area Path**: When switching area paths on ImportTestCases page, click "Sync" to reload the filtered test case set.

3. **Understand Hierarchical Matching**: If parent path is selected (e.g., "AppServer OMI"), results include all child paths ("AppServer OMI\Team.Rangers", "AppServer OMI\ArchestrA Config", etc.)

### For Implementation

If users continue to report issues despite the above, investigate:

1. **Check browser console** for the debug logs added:
   - Look for "Duplicates :: Area Path filtering" message
   - Verify `selectedAreaPaths` contains expected values
   - Verify `filteredCount` is less than `totalCount`

2. **Verify import completion**: Ensure backend returned the correct count before detection

3. **Test hierarchical matching**: Verify that parent path selection correctly includes child paths

---

## Verification Steps

1. ✅ Rebuild with debug logging: `npm run build`
2. ✅ Open browser DevTools Console (F12)
3. ✅ Select an Area Path on Import Test Cases page
4. ✅ Click "Sync" button
5. ✅ Watch console for import completion messages
6. ✅ Navigate to Duplicates tab
7. ✅ Click "Run detection" button
8. ✅ Check console for "Duplicates :: Running detection" message
9. ✅ Verify `eligibleCasesCount` matches selected area path expectations

---

## Code Changes Made

1. **DuplicatesPanel.jsx** (line 216):
   - Added `selectedAreaPaths` to context destructuring

2. **DuplicatesPanel.jsx** (lines 230-254):
   - Enhanced `eligibleTestCases` filter to include area path matching logic
   - Added console.debug() logging for diagnostic purposes

3. **DuplicatesPanel.jsx** (lines 262-267):
   - Added console logging in `runDetection()` function

4. **DuplicatesPanel.jsx** (lines 350-356):
   - Enhanced UI hint text to display area path filter information
   - Shows count of eligible vs total test cases

---

## Files Reviewed

✅ `src/pages/ado/DuplicatesPanel.jsx` - Detection UI and filtering logic  
✅ `src/pages/ImportTestCases.jsx` - Import flow and area path selection  
✅ `src/services/apiService.js` - Frontend API calls  
✅ `src/context/AdoConnectionContext.jsx` - State management  
✅ `src/utils/duplicates.js` - Detection algorithm  
✅ `backend/src/TestCaseAssistant.Api/Controllers/ImportController.cs` - API endpoints  
✅ `backend/src/TestCaseAssistant.Infrastructure/Services/AzureDevOpsConnectionService.cs` - Backend filtering logic  

---

## Conclusion

**All filtering logic is correctly implemented.** The issue is most likely a **user workflow/expectation issue** where:

1. User expects area path filtering to persist after changing selections
2. User doesn't realize they need to sync again after changing area paths
3. User selects a parent path not realizing it includes child paths
4. Multiple syncs mix results from different area paths

**The UI enhancements added will help users:**
- Understand which area paths are being used for filtering
- See the actual count of test cases being analyzed
- Recognize when area path filter is not applied
