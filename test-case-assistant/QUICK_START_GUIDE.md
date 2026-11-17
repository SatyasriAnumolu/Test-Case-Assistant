# AI Test Generator - Quick Start & Feature Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation & Build
```bash
cd test-case-assistant
npm install
npm run build      # Build for production
npm run dev        # Development server
```

### Accessing the Application
- **Development**: http://localhost:5173/?ado-connection
- **Production**: Deployed URL (depends on your hosting)

---

## 📖 User Guide

### 1. Entering Requirements

#### Title Field
- **Description**: Clear, concise requirement statement
- **Example**: "InTouch HMI alarm handler correctly processes high-priority alarms from Application Server"
- **Tips**: 
  - Be specific about AVEVA components
  - Use active voice
  - Keep under 100 characters if possible

#### Description Field
- **Description**: Detailed explanation of the requirement
- **Hints**: Specify AVEVA product, user roles, system state
- **Example**: "When an InTouch HMI operator logs in, alarms from Application Server over OMI connection should display in real-time..."
- **Tips**:
  - Include context and background
  - Mention all relevant AVEVA components
  - Describe expected behavior clearly

#### Acceptance Criteria (Optional)
- **Description**: Specific conditions for success
- **Format**: Given/When/Then format
- **Example**:
  ```
  Given an InTouch app with 10 Application Servers
  When a critical alarm is raised
  Then the alarm appears within 500ms
  And the audio alert plays
  ```
- **Tips**:
  - One condition per line
  - Be specific with numbers/timing
  - Include edge cases

### 2. Guidance Tips Display

The guidance box shows three key points:
- **Title**: Clear, concise requirement for AVEVA components
- **Description**: AVEVA product, user roles, system state, outcome
- **Criteria**: Given/When/Then format with AVEVA configurations

### 3. Generating Test Content

#### Generation Process
1. Fill in Title (required) and Description (required)
2. Click **Generate Test Assets**
3. Review the Preconditions and Test Steps tabs
4. Click **Regenerate** to replace the current generated content

### 4. Reviewing Generated Content

#### Preconditions Tab
- Shows each precondition in a numbered row with editable **Action** and **Expected Result** fields.
- Expected results describe the setup for that row; they are separate from test-step results.
- Results stay paired with their precondition. Separate precondition-result lists are matched by index only when their counts agree.
- Existing edits, including intentionally cleared expected-result fields, are retained.
- Review the generated text before publishing. The current generator uses local, pattern-based placeholders.

#### Test Steps Tab
- Shows numbered test steps with editable **Action** and **Expected Result** fields.
- Changes made in either tab are retained until regeneration or leaving the page.

### 5. Publishing to Azure DevOps

#### Save to ADO Button
- **Required**: Generate Steps first
- **Connected**: Requires ADO connection setup
- **Action**: 
  1. Validates all required fields
  2. Publishes test case to Azure DevOps
  3. Creates work item in selected project
  4. Adds the preconditions (action + expected result) as the first rows of the Test Steps grid, followed by the generated test steps
- **Update an existing test case**: enter its ID in **Existing Test Case ID** (the button changes to **Update in ADO**). The title and the whole Steps grid are replaced; the existing description, area path and other fields are kept. The ID must be a Test Case in the connected project.

#### After Publishing Success
- Shows "Published to Azure DevOps"
- Displays Work Item ID
- **Copy Button**: Click to copy ID to clipboard
- Share or open in Azure DevOps

### 6. Exporting Results

#### Export Button
- **Format**: JSON file
- **Contents**: All inputs and generated outputs
- **Preconditions**: Each entry includes its action and expected result
- **Use**: Backup, sharing, external analysis
- **Save Location**: Downloads folder

---

## 💡 Tips & Best Practices

### Writing Better Requirements
✅ **Do**:
- Be specific and detailed
- Include context and background
- Mention relevant AVEVA components
- Use technical terminology
- Include timing/performance expectations
- Reference specific HAVIA modules

❌ **Don't**:
- Be vague or general
- Mix multiple requirements
- Ignore edge cases
- Forget system configuration
- Skip acceptance criteria

### For Best AI Generation
✅ **Effective Requirements**:
```
"InTouch operator can acknowledge alarms 
through alarm handler with privilege levels 
respected by Galaxy Repository, ensuring 
Historian logs all ack events."
```

❌ **Vague Requirements**:
```
"Test the alarm system"
```

### Using Copy to Clipboard
1. Hover over any generated item
2. Click the Copy icon button
3. Icon tooltip changes to "Copied!"
4. Auto-dismisses after 2 seconds
5. Paste anywhere with Ctrl+V

### Checking Generation Summary
- Summary cards appear after generation
- Shows count of each content type
- Helps verify complete generation
- Disappears on page reload

### Tab Count Badges
- Green badge on tabs with content
- Shows number of items
- Disappears when tab is empty
- Helps navigate between sections

---

## ⌨️ Keyboard Navigation

### Form Navigation
- **Tab**: Move to next field
- **Shift+Tab**: Move to previous field
- **Enter**: In textareas, Enter creates new line
- **Ctrl+Enter**: (Browser dependent) May submit

### Button Navigation
- **Tab**: Focus on buttons
- **Space/Enter**: Activate button
- **Mouse**: Click as normal

### Tab Navigation
- **Left/Right Arrow**: Switch tabs (if supported)
- **Click**: Switch tabs directly
- **Tab**: Navigate within tab content

---

## 🎨 UI/UX Features

### Responsive Design
- **Desktop** (1100px+): 2-column layout
- **Tablet** (768-1100px): Single column
- **Mobile** (<768px): Mobile optimized

### Visual Feedback
- ✨ Hover effects on buttons
- ✏️ Progress indicator during generation
- ✅ Success notifications (green)
- ⚠️ Warning notifications (orange)
- ❌ Error notifications (red)
- 📋 Copy confirmation (tooltip)

### Accessibility Features
- Keyboard navigation throughout
- Screen reader compatible
- High color contrast
- Focus indicators visible
- Touch-friendly sizing (44px minimum)

---

## 🐛 Troubleshooting

### Generation Not Starting
- ✅ Check Title field is filled
- ✅ Check Description field is filled
- ✅ Check connection status
- ✅ Try refreshing the page

### No Results Generated
- Check for error notifications (red)
- Verify requirement text is clear
- Try with simpler requirement first
- Check browser console for errors

### Can't Publish to ADO
- ✅ Check Azure DevOps connection
- ✅ Ensure Generate Steps first
- ✅ Verify ADO permissions
- ✅ Check project access

### Slow Generation
- Normal for complex requirements
- Give AI time to generate
- Check browser console
- Reduce requirement complexity

### Copy to Clipboard Not Working
- Check browser security settings
- Ensure HTTPS connection (production)
- Try different browser
- Check clipboard permissions

---

## 📱 Mobile Usage

### Touch-Friendly Interface
- Large buttons (44px minimum)
- Easy tab navigation
- Clear visual feedback
- Stacked layout

### Mobile Tips
- Portrait orientation preferred
- Scroll to see all content
- Use copy button for results
- Test on actual device

---

## 🔧 Advanced Features

### Generation Summary
Shows after content is generated:
- Number of Steps
- Number of Expected Results
- Number of Scenarios
- Number of Test Data items

### Count Badges
Appear on tabs when content exists:
- Green = Steps, Results, Data
- Orange = Scenarios

### Work Item Integration
After successful publish:
- Work Item ID displayed
- Click copy button to save ID
- Can share with team
- Opens in Azure DevOps

---

## 📚 Related Documentation

- **AI_GENERATOR_UX_IMPROVEMENTS.md** - Feature details
- **TECHNICAL_IMPROVEMENTS_SUMMARY.md** - Technical specs
- **UX_IMPROVEMENTS_CHECKLIST.md** - Complete checklist
- **IMPLEMENTATION_COMPLETE.md** - Project summary

---

## 🆘 Support

### Reporting Issues
1. Check console for error messages
2. Note the exact action that failed
3. Include requirement text if possible
4. Include error message/screenshot
5. Contact development team

### Performance Issues
- Clear browser cache
- Try incognito/private window
- Check internet connection
- Try different browser
- Restart application

### Accessibility Issues
- Use latest browser version
- Enable JavaScript
- Check screen reader settings
- Try keyboard navigation
- Contact accessibility team

---

## ✅ Checklist Before Publishing

- [ ] Title filled and descriptive
- [ ] Description detailed and clear
- [ ] Generated Steps reviewed and valid
- [ ] Expected Results make sense
- [ ] Negative Scenarios comprehensive
- [ ] Test Data appropriate
- [ ] Connected to Azure DevOps
- [ ] Ready to publish

---

**Last Updated**: 2026-11-03  
**Version**: 2.0 (Enhanced UI/UX)  
**Status**: ✅ Production Ready
