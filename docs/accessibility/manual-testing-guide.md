# Manual Accessibility Testing Guide

This guide provides procedures for testing WCAG AAA criteria that cannot be fully automated.

## Table of Contents

1. [Screen Reader Testing](#screen-reader-testing)
2. [Content Quality Testing](#content-quality-testing)
3. [Visual Presentation Testing](#visual-presentation-testing)
4. [User Experience Testing](#user-experience-testing)
5. [Form Interaction Testing](#form-interaction-testing)

---

## Screen Reader Testing

### Required Tools

- **Windows**: NVDA (free) or JAWS
- **macOS**: VoiceOver (built-in)
- **Linux**: Orca

### Test Procedures

#### 1. Page Structure Navigation (WCAG 1.3.1, 2.4.1)

**Steps**:

1. Launch screen reader
2. Navigate to page
3. Use heading navigation (H key in NVDA/JAWS)
4. Use landmark navigation (D key for regions)

**Success Criteria**:

- All headings are announced correctly
- Heading levels are logical (h1 → h2 → h3)
- Main landmarks are present (main, navigation, complementary)
- Can skip to main content

#### 2. Form Interaction (WCAG 3.3.1, 3.3.2, 3.3.5)

**Steps**:

1. Navigate to a form using Tab
2. Listen to each label announcement
3. Trigger validation errors
4. Listen to error announcements

**Success Criteria**:

- All form fields have descriptive labels
- Required fields are announced as "required"
- Error messages are announced in context
- Help text is announced when available

#### 3. Interactive Elements (WCAG 4.1.2)

**Steps**:

1. Tab to buttons, links, and custom controls
2. Listen to role and state announcements
3. Activate controls with Enter/Space

**Success Criteria**:

- Role is announced (button, link, checkbox, etc.)
- State is announced (expanded, checked, selected, etc.)
- Name/label is clear and descriptive

---

## Content Quality Testing

### Reading Level (WCAG 3.1.5 AAA)

**Objective**: Ensure content can be understood by users with lower secondary education (approximately 9th grade).

**Tools**:

- [Hemingway Editor](http://www.hemingwayapp.com/)
- [Readable.com](https://readable.com/)
- Microsoft Word readability statistics

**Steps**:

1. Copy main content text
2. Paste into readability tool
3. Check Flesch-Kincaid grade level

**Success Criteria**:

- Content should score 9th grade level or below
- Complex topics may be exempt if supplementary simpler text is provided
- Technical documentation may require glossary

### Unusual Words & Abbreviations (WCAG 3.1.3, 3.1.4 AAA)

**Steps**:

1. Review all page content
2. Identify jargon, idioms, technical terms
3. Check for first-use definitions or glossary links
4. Identify all abbreviations
5. Verify `<abbr>` tags or first-use expansions

**Success Criteria checklist**:

- [ ] Jargon and technical terms have definitions on first use
- [ ] Idioms are avoided or explained
- [ ] Abbreviations are expanded on first use
- [ ] Glossary is available for specialized terms
- [ ] `<abbr title="...">` is used for abbreviations

### Pronunciation (WCAG 3.1.6 AAA)

**Steps**:

1. Review content for words with ambiguous pronunciation
2. Check for pronunciation guides (IPA, phonetic spelling)
3. Test with screen reader to verify pronunciation

**Examples of ambiguous words**:

- read (present vs. past tense)
- bass (fish vs. music)
- tear (crying vs. ripping)

**Success Criteria**:

- Critical words have pronunciation clarification
- Proper names include pronunciation where helpful

---

## Visual Presentation Testing

### Text Zoom 200% (WCAG 1.4.4 AA, 1.4.8 AAA)

**Steps**:

1. Open page in browser
2. Zoom to 200% (Ctrl + or Cmd +)
3. Navigate entire page

**Success Criteria checklist**:

- [ ] No content is cut off or hidden
- [ ] No horizontal scrolling required (except data tables)
- [ ] Text remains readable
- [ ] Buttons and controls still functional
- [ ] No overlapping text or elements

### Contrast Enhanced (WCAG 1.4.6 AAA)

**Tools**:

- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Browser DevTools color picker

**Requirements**:

- **Normal text**: 7:1 minimum
- **Large text** (18pt or 14pt bold): 4.5:1 minimum

**Steps**:

1. Inspect text elements
2. Note foreground and background colors
3. Calculate contrast ratio
4. Verify meets AAA requirements

**Checklist**:

- [ ] Body text has 7:1 contrast
- [ ] Headings have 7:1 contrast
- [ ] Large text has minimum 4.5:1 contrast
- [ ] UI components have 3:1 contrast
- [ ] Links are distinguishable without color alone

### Content on Hover/Focus (WCAG 1.4.13 AA)

**Steps**:

1. Identify all tooltips, popovers, dropdowns
2. Trigger each with hover
3. Trigger each with keyboard focus
4. Test persistence and dismissibility

**Success Criteria**:

- Content appears on both hover AND focus
- Content can be dismissed without moving pointer
- Content remains visible when hovering over it
- Content doesn't obscure other important information

---

## User Experience Testing

### Consistent Navigation (WCAG 3.2.3 AA)

**Steps**:

1. Navigate to 5+ different pages
2. Note position and order of navigation elements
3. Compare across pages

**Success Criteria checklist**:

- [ ] Main navigation is in same location on all pages
- [ ] Items appear in same relative order
- [ ] Search box (if present) is in consistent location
- [ ] Footer links are consistent

### Consistent Identification (WCAG 3.2.4 AA)

**Steps**:

1. Identify repeated UI components (buttons, icons, links)
2. Check labeling and iconography across pages
3. Verify same functionality = same appearance

**Examples**:

- Save button always labeled "Save" or "Guardar"
- Delete always uses same icon
- "Home" always goes to dashboard

**Success Criteria checklist**:

- [ ] Icons used consistently for same functions
- [ ] Labels used consistently for same functions
- [ ] Same visual design for equivalent components

### Timing and Session Management (WCAG 2.2.3, 2.2.5, 2.2.6 AAA)

**Test 1: No Timing (2.2.3 AAA)**

**Steps**:

1. Start form or process
2. Leave page idle for extended period (15+ minutes)
3. Attempt to continue

**Success Criteria**:

- No time limits for content consumption
- Processes do not time out (or timing can be disabled)
- Data is preserved across session

**Test 2: Re-authentication (2.2.5 AAA)**

**Steps**:

1. Start multi-step process
2. Wait for session timeout
3. Re-authenticate
4. Verify data preservation

**Success Criteria**:

- User can continue from where they left off
- No data loss after re-authentication

**Test 3: Timeout Warnings (2.2.6 AAA)**

**Steps**:

1. Review pages for timeout mechanisms
2. Check for advance warning

**Success Criteria**:

- Users are warned of timeouts at least 20 seconds in advance
- Users can extend session easily

---

## Form Interaction Testing

### Error Prevention - All (WCAG 3.3.6 AAA)

**Steps**:

1. Complete a form with important data
2. Look for confirmation step
3. Test ability to review before submit
4. Test ability to correct information
5. Test undo mechanism if available

**Success Criteria checklist**:

- [ ] Submissions are reversible OR
- [ ] Data is checked for errors before submission OR
- [ ] User can review and confirm before final submission

**Critical forms requiring testing**:

- Financial transactions
- Data deletion
- User account changes
- Purchase orders

### Contextual Help (WCAG 3.3.5 AAA)

**Steps**:

1. Review all complex form fields
2. Check for help text, examples, or instructions
3. Verify help is available in context

**Examples of complex fields**:

- Date pickers
- Password requirements
- Email format
- Phone number format
- Address fields

**Success Criteria checklist**:

- [ ] Complex fields have help text
- [ ] Help text is visible or easily accessible
- [ ] Examples are provided where helpful
- [ ] Format requirements are stated clearly

---

## Testing Checklist

Use this checklist for each major page or flow:

### Screen Reader Tests

- [ ] Page structure navigable by headings
- [ ] Landmarks properly announced
- [ ] Forms fully accessible
- [ ] Error messages announced
- [ ] Interactive elements have correct roles

### Content Quality

- [ ] Reading level appropriate (9th grade or below)
- [ ] Technical terms defined
- [ ] Abbreviations expanded
- [ ] Pronunciation clear for ambiguous words

### Visual Presentation

- [ ] 200% zoom without content loss
- [ ] Contrast meets AAA (7:1 for text)
- [ ] Hover/focus content accessible
- [ ] No images of text

### User Experience

- [ ] Navigation consistent across pages
- [ ] Components identified consistently
- [ ] No unexpected timeouts
- [ ] Session preserved after re-auth

### Forms

- [ ] Help available for complex fields
- [ ] Review/confirm before submission
- [ ] Errors preventable or reversible

---

## Reporting Issues

When you find accessibility issues during manual testing:

1. **Document the issue**:
   - Which WCAG criterion is violated
   - Current behavior
   - Expected behavior
   - Steps to reproduce

2. **Rate severity**:
   - **Critical**: Blocks primary user tasks
   - **High**: Significantly impairs experience
   - **Medium**: Causes inconvenience
   - **Low**: Minor issue, mostly cosmetic

3. **Create GitHub issue** with label `accessibility`

4. **Track in coverage matrix**: Update `wcag-aaa-coverage.md` if issue reveals gap in testing

---

## Recommended Testing Schedule

- **Every Release**: Run full automated test suite
- **Major Features**: Manual testing of new components
- **Quarterly**: Full manual accessibility audit
- **Annually**: Third-party accessibility audit

---

_Last Updated: 2026-01-22_
