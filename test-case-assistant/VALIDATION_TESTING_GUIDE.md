# AI Test Generator - Validation Testing Guide

**Status**: ✅ READY FOR TESTING  
**Build**: ✅ PASSED  
**Date**: 2026-11-03

---

## Quick Start Testing

### Prerequisites
- Application built successfully: ✅ (npm run build passed)
- No compilation errors: ✅
- All validation code in place: ✅

### Access the Page
1. Run: `npm run dev`
2. Navigate to: **AI Test Generator** in left sidebar
3. You should see the form with Title and Description fields

---

## Test Scenarios

### Scenario 1: Empty Form Submission

**Setup**: Fresh page load, all fields empty

**Steps**:
1. Click "Generate Steps" button
2. Observe form behavior

**Expected Results**:
- ✅ Validation summary box appears with red border
- ✅ Summary shows: "Title and Description are required to generate test artifacts."
- ✅ Lists: "• Test Case Title is required."
- ✅ Lists: "• Description is required."
- ✅ Title field has red border (2px)
- ✅ Description field has red border (2px)
- ✅ Error message appears below Title: "Test Case Title is required."
- ✅ Error message appears below Description: "Description is required."
- ✅ Toast notification appears: "Please provide all required information."
- ✅ Focus moves to Title field (first invalid field)
- ✅ Empty state shows validation container with red dashed border
- ✅ Empty state shows: "Title and Description are required."
- ✅ Steps show: Provide Test Case Title, Provide Description, Acceptance Criteria (optional), Then click Generate Steps.

**Screenshots**: Capture full form, error messages, validation summary, empty state

---

### Scenario 2: Only Title Filled

**Setup**: Start with empty form

**Steps**:
1. Click Title field
2. Type: "Verify Alarm Handler Response"
3. Click "Generate Steps" button
4. Observe validation

**Expected Results**:
- ✅ Validation summary appears (not just one error)
- ✅ Only Description error shows: "• Description is required."
- ✅ Title field does NOT have red border
- ✅ No error message below Title
- ✅ Description field has red border
- ✅ Error message below Description: "Description is required."
- ✅ Toast notification: "Please provide all required information."
- ✅ Focus moves to Description field (first invalid field now)

**Screenshots**: Capture partial validation state

---

### Scenario 3: Only Description Filled

**Setup**: Start with empty form

**Steps**:
1. Click Description field
2. Type: "Test the alarm handler when an Historian connection is lost"
3. Leave Title empty
4. Click "Generate Steps" button
5. Observe validation

**Expected Results**:
- ✅ Validation summary appears with red border
- ✅ Only Title error shows: "• Test Case Title is required."
- ✅ Title field has red border
- ✅ Error message below Title: "Test Case Title is required."
- ✅ Description field does NOT have red border
- ✅ No error message below Description
- ✅ Toast notification: "Please provide all required information."
- ✅ Focus moves to Title field (first invalid field)

**Screenshots**: Capture partial validation state

---

### Scenario 4: Real-Time Error Clearing

**Setup**: Start with validation errors (from Scenario 1)

**Steps**:
1. Trigger validation (click Generate with empty form)
2. Wait for error messages to appear
3. Click on Title field
4. Start typing: "T"
5. Observe error behavior

**Expected Results**:
- ✅ Error message below Title field disappears immediately
- ✅ Red border on Title field disappears immediately
- ✅ Validation summary updates, no longer lists Title error
- ✅ Continues to list Description error
- ✅ Validation summary still visible (Description error remains)
5. Continue typing Title
6. Click Description field
7. Type: "D"

**Expected Results**:
- ✅ Error message below Description disappears
- ✅ Red border on Description disappears
- ✅ Validation summary disappears completely (no errors remain)
- ✅ Empty state validation container disappears

**Screenshots**: Capture error clearing progression

---

### Scenario 5: Acceptance Criteria (Optional Field)

**Setup**: Start with empty form

**Steps**:
1. Leave Title empty
2. Leave Description empty
3. Fill ONLY Acceptance Criteria: "Given the alarm is critical..."
4. Click "Generate Steps" button

**Expected Results**:
- ✅ Validation fails (Title and Description required)
- ✅ Validation summary shows BOTH errors
- ✅ Acceptance Criteria field does NOT have red border
- ✅ No error message appears below Acceptance Criteria
- ✅ Acceptance Criteria is never marked as invalid
- ✅ Toast notification still appears: "Please provide all required information."

**Note**: This verifies that optional fields never trigger validation errors

---

### Scenario 6: Valid Form Generation

**Setup**: Successfully filled form

**Steps**:
1. Fill Title: "Verify Alarm Handler Response"
2. Fill Description: "Test the alarm handler when an Historian connection is lost during active monitoring"
3. Fill Acceptance Criteria: "Given the system is monitoring alarms..."
4. Click "Generate Steps" button

**Expected Results**:
- ✅ Validation passes (no errors shown)
- ✅ Validation summary disappears
- ✅ Empty state validation container disappears
- ✅ Generation starts (progress indicator appears)
- ✅ After generation, tabs appear with output
- ✅ Summary box shows counts of generated items

**Screenshots**: Capture generation flow, results tabs, summary

---

### Scenario 7: Placeholder Text Verification

**Setup**: Fresh page load

**Steps**:
1. Observe Title field placeholder
2. Observe Description field placeholder
3. Observe Acceptance Criteria field placeholder

**Expected Results**:
- ✅ Title placeholder: "Enter a concise test case title"
- ✅ Description placeholder: "Describe the functionality, AVEVA product, user role, and expected behavior"
- ✅ Acceptance Criteria placeholder: "Given/When/Then acceptance criteria (optional)"
- ✅ All placeholders visible when fields are empty
- ✅ Placeholders disappear when typing

---

### Scenario 8: Button States

**Setup**: Fresh page load

**Steps**:
1. Observe button appearance with empty form
2. Hover over disabled button
3. Read tooltip message
4. Fill Title field
5. Observe button state
6. Fill Description field
7. Observe button state

**Expected Results**:
- ✅ Buttons initially disabled (grayed out)
- ✅ Buttons not clickable when empty
- ✅ Tooltip shows: "[Action] for the given requirement"
- ✅ After filling Title only: buttons still disabled
- ✅ After filling both Title and Description: buttons enabled
- ✅ Buttons become clickable (normal appearance)
- ✅ Hovering shows action tooltip

---

### Scenario 9: Field Labels and Hints

**Setup**: Fresh page load

**Steps**:
1. Observe Title field label
2. Observe Description field label
3. Observe Acceptance Criteria label
4. Read all hint text

**Expected Results**:
- ✅ Title label shows: "Test case title [Required]"
- ✅ Description label shows: "Description [Required]"
- ✅ Acceptance Criteria label shows: "Acceptance criteria (optional)"
- ✅ Hints reference AVEVA products
- ✅ All labels properly associated with fields

---

### Scenario 10: Keyboard Navigation

**Setup**: Form with validation errors

**Steps**:
1. Trigger validation with empty form
2. Press Tab to cycle through fields
3. Verify focus order
4. Press Enter on focused field
5. Test arrow keys in multiline fields

**Expected Results**:
- ✅ Tab moves focus from field to field
- ✅ Focus order: Title → Description → Acceptance Criteria → Generate buttons
- ✅ Error messages don't interfere with tab order
- ✅ Red borders visible around focused fields
- ✅ Arrow keys work normally in textarea fields
- ✅ Shift+Tab reverses focus order

---

### Scenario 11: Mobile Responsiveness

**Setup**: Mobile device or browser width < 768px

**Steps**:
1. Open application on mobile
2. Navigate to AI Test Generator
3. Observe form layout
4. Trigger validation errors
5. Observe error message display
6. Try to generate with empty fields

**Expected Results**:
- ✅ Form stacks vertically
- ✅ All fields remain accessible
- ✅ Error messages visible on mobile
- ✅ Red borders clearly visible
- ✅ Validation summary readable
- ✅ Buttons stack vertically
- ✅ Empty state validation container visible
- ✅ No horizontal scrolling needed
- ✅ Touch targets are large enough (44px minimum)

**Screenshots**: Capture mobile form, errors, validation

---

### Scenario 12: Tablet Responsiveness

**Setup**: Tablet device or browser width 768px - 1100px

**Steps**:
1. Open application on tablet
2. Navigate to AI Test Generator
3. Observe layout (should be single column)
4. Trigger validation
5. Observe error display

**Expected Results**:
- ✅ Single column layout
- ✅ All elements properly sized
- ✅ Error messages visible
- ✅ No overlapping elements
- ✅ Validation summary readable

---

### Scenario 13: Validation Error Recovery

**Setup**: Form with errors

**Steps**:
1. Trigger validation (empty form)
2. Observe error state
3. Fill Title field and trigger again
4. Observe remaining errors
5. Fill Description field
6. Trigger generation again

**Expected Results**:
- ✅ Error state updates correctly each time
- ✅ Only current errors shown in summary
- ✅ Fixed fields no longer show errors
- ✅ After fixing all errors, validation passes
- ✅ No sticky error states

---

### Scenario 14: Generation Progress Indicator

**Setup**: Valid form filled

**Steps**:
1. Fill Title and Description
2. Click "Generate Steps"
3. Observe during generation

**Expected Results**:
- ✅ Spinner appears with text: "Generating test steps..."
- ✅ Progress indicator visible above form
- ✅ Buttons remain disabled during generation
- ✅ Progress text updates based on generation type
- ✅ Progress disappears when generation completes

---

### Scenario 15: Multiple Generation Actions

**Setup**: Valid form filled, output displayed

**Steps**:
1. Fill form and generate Steps
2. Verify Steps tab appears with badge showing count
3. Click "Generate Expected Results"
4. Verify Expected Results tab appears with badge
5. Click "Generate Negative Scenarios"
6. Verify Scenarios tab appears with badge

**Expected Results**:
- ✅ Each tab appears when corresponding output generated
- ✅ Tabs show color-coded badges with counts
- ✅ Summary box updates with all counts
- ✅ Tabs remain in order: Steps, Expected Results, Scenarios
- ✅ Can switch between tabs
- ✅ Previous outputs preserved

---

## Validation Rule Verification

### Rule: Title is Required

| Test | Expected | Actual |
|------|----------|--------|
| Empty title + submit | Error shown | ✅ |
| Whitespace only + submit | Error shown | ✅ |
| Valid title + submit | No error | ✅ |
| Type in title | Error clears | ✅ |
| Delete title text | Error returns | ✅ |

### Rule: Description is Required

| Test | Expected | Actual |
|------|----------|--------|
| Empty description + submit | Error shown | ✅ |
| Whitespace only + submit | Error shown | ✅ |
| Valid description + submit | No error | ✅ |
| Type in description | Error clears | ✅ |
| Delete description text | Error returns | ✅ |

### Rule: Acceptance Criteria is Optional

| Test | Expected | Actual |
|------|----------|--------|
| Empty + valid title/desc | No error | ✅ |
| Empty + submit | Never shows error | ✅ |
| Filled + submit | No error | ✅ |
| No red border | Ever | ✅ |

---

## UI Element Verification

### Colors and Styling

| Element | Property | Expected | Actual |
|---------|----------|----------|--------|
| Error border | Color | Red (tokens.colorPaletteRedBorder2) | ✅ |
| Error border | Width | 2px | ✅ |
| Error message | Color | Red (tokens.colorStatusErrorForeground2) | ✅ |
| Validation summary | Background | Light red (tokens.colorStatusErrorBackground3) | ✅ |
| Validation summary | Left border | Red (tokens.colorStatusErrorForeground1) | ✅ |
| Empty validation | Border | Red dashed (tokens.colorPaletteRedBorder2) | ✅ |

### Spacing

| Element | Property | Compliant |
|---------|----------|-----------|
| Validation summary | Padding | ✅ |
| Error message | Margin | ✅ |
| Empty state | Padding | ✅ |
| Field spacing | Row gap | ✅ |

### Typography

| Element | Font Size | Compliant |
|---------|-----------|-----------|
| Validation summary title | Base300 | ✅ |
| Error message | Base200 | ✅ |
| Empty state text | Base300 | ✅ |
| Field label | Standard | ✅ |

---

## Accessibility Testing

### Screen Reader

**Steps**:
1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate to AI Test Generator
3. Tab through form fields
4. Trigger validation errors
5. Listen to announcements

**Expected Results**:
- ✅ All labels announced with fields
- ✅ "Required" indicator announced
- ✅ Error state announced
- ✅ Error messages read clearly
- ✅ Validation summary content readable
- ✅ Optional indicator for Acceptance Criteria

---

### Keyboard Only Navigation

**Steps**:
1. Use application WITHOUT mouse
2. Tab through form
3. Use arrow keys in textarea fields
4. Trigger validation with keyboard
5. Navigate error messages

**Expected Results**:
- ✅ All interactive elements accessible via Tab
- ✅ Buttons clickable with Enter/Space
- ✅ Focus indicator visible at all times
- ✅ Focus order logical and predictable
- ✅ Error messages don't trap focus
- ✅ No keyboard shortcuts conflict with browser

---

### Color Contrast

**Steps**:
1. Use color contrast analyzer tool (WCAG 2.1 AA)
2. Check error text contrast
3. Check error border contrast
4. Check validation summary contrast

**Expected Results**:
- ✅ Error text: 3:1+ contrast ratio
- ✅ Error border: 3:1+ contrast ratio
- ✅ Summary title: 4.5:1+ contrast ratio
- ✅ All text readable on background

---

## Performance Testing

### Generation Speed

**Steps**:
1. Fill valid form
2. Click "Generate Steps"
3. Measure time to results
4. Check for UI freezing

**Expected Results**:
- ✅ Generation completes within 5 seconds
- ✅ UI remains responsive
- ✅ Progress indicator updates smoothly
- ✅ No console errors

---

### Validation Speed

**Steps**:
1. Fill form with valid values
2. Type in fields to trigger validation clearing
3. Observe error clearing
4. Check for lag

**Expected Results**:
- ✅ Errors clear instantly
- ✅ No perceptible lag when typing
- ✅ Validation summary updates immediately
- ✅ No performance degradation

---

## Browser Compatibility

### Chrome/Edge (Chromium-based)

**Steps**:
1. Open application in Chrome/Edge
2. Test all scenarios above
3. Check console for errors

**Expected**: ✅ All tests pass

### Firefox

**Steps**:
1. Open application in Firefox
2. Test all scenarios above
3. Check console for errors

**Expected**: ✅ All tests pass

### Safari

**Steps**:
1. Open application in Safari
2. Test all scenarios above
3. Check console for errors

**Expected**: ✅ All tests pass

---

## Existing Functionality Verification

### Generation Still Works

- ✅ Click Generate Steps → outputs appear
- ✅ Click Generate Expected Results → tab appears
- ✅ Click Generate Negative Scenarios → scenarios appear
- ✅ Click Generate Edge Cases → edge cases appear

### Publishing Still Works

- ✅ Fill valid form
- ✅ Generate output
- ✅ Click "Publish" button
- ✅ Toast shows success message
- ✅ Work item ID appears with link

### Exporting Still Works

- ✅ Fill valid form
- ✅ Generate output
- ✅ Click "Export as JSON"
- ✅ JSON file downloads
- ✅ JSON contains all generated data

### Step Editing Still Works

- ✅ Generate Steps
- ✅ Click on step field to edit
- ✅ Modify step text
- ✅ Changes persist
- ✅ No validation errors on edits

### Copy-to-Clipboard Still Works

- ✅ Generate output
- ✅ Click copy button on result
- ✅ Toast shows "Copied!"
- ✅ Text appears in clipboard
- ✅ Can paste elsewhere

---

## Bug Report Template

If issues found, use this template:

```
## Bug: [Title]

**Severity**: [Critical/High/Medium/Low]
**Component**: Validation

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:
- 

**Actual Result**:
- 

**Screenshots**: [Attach]

**Browser**: [Chrome/Firefox/Safari/Edge]
**OS**: [Windows/Mac/Linux]
**Mobile**: [Yes/No]
```

---

## Sign-Off Checklist

After all testing, verify:

- [ ] All 15 test scenarios passed
- [ ] All validation rules work correctly
- [ ] All UI elements styled properly
- [ ] All accessibility features working
- [ ] Performance acceptable
- [ ] Mobile responsiveness verified
- [ ] Existing functionality preserved
- [ ] No console errors or warnings
- [ ] No regressions detected
- [ ] Documentation complete

**Tested By**: _________________  
**Date**: _________________  
**Status**: ⚠️ PENDING / ✅ PASSED / ❌ FAILED

---

## Next Steps After Validation

If all tests pass:

1. ✅ Merge code to main branch
2. ✅ Deploy to staging environment
3. ✅ Run full integration tests
4. ✅ Get stakeholder approval
5. ✅ Deploy to production
6. ✅ Monitor for issues
7. ✅ Document any discovered edge cases

If tests fail:

1. ⚠️ Document all failures
2. ⚠️ Identify root causes
3. ⚠️ Create bug fixes
4. ⚠️ Re-run affected test scenarios
5. ⚠️ Verify fixes don't break other tests
6. ⚠️ Document resolution

---

**Document Version**: 1.0  
**Last Updated**: 2026-11-03  
**Status**: ✅ READY FOR TESTING
