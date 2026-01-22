# Accessibility Documentation

This directory contains comprehensive accessibility testing documentation and guidelines for the Tanuki Admin application.

## 📚 Documentation Files

### [WCAG AAA Coverage Matrix](./wcag-aaa-coverage.md)

Complete mapping of all WCAG 2.2 Level AAA success criteria to our testing coverage, including:
- **100 total WCAG criteria** (A, AA, and AAA levels)
- **45 AAA-specific criteria**
- Status of each criterion (Automated, Manual, Partial, N/A)
- References to test files
- Coverage statistics

### [Manual Testing Guide](./manual-testing-guide.md)

Detailed procedures for criteria that require human evaluation:
- Screen reader testing procedures
- Content quality assessment
- Visual presentation verification
- User experience testing
- Form interaction testing
- Testing checklists and schedules

## 🧪 Automated Test Suite

Our Cypress test suite includes:

| Test File | Focus Area | WCAG Criteria |
|-----------|-----------|---------------|
| `accessibility.cy.ts` | Core axe-core checks | 13+ criteria including contrast, ARIA, structure |
| `a11y-keyboard-navigation.cy.ts` | Keyboard accessibility | 2.1.1, 2.1.2, 2.1.3, 2.4.3, 2.4.7 |
| `a11y-target-size.cy.ts` | Touch target sizes | 2.5.5 (AAA), 2.5.8 |
| `a11y-text-spacing.cy.ts` | Text presentation | 1.4.4, 1.4.8, 1.4.10, 1.4.12 |
| `a11y-forms-enhanced.cy.ts` | Form accessibility | 3.3.1-3.3.5, 4.1.3 |

## 🚀 Running Tests

### Run All Accessibility Tests

```bash
npm run test:a11y
```

### Run Specific Test Suite

```bash
# Core accessibility checks
npx cypress run --spec "cypress/e2e/accessibility.cy.ts"

# Keyboard navigation
npx cypress run --spec "cypress/e2e/a11y-keyboard-navigation.cy.ts"

# Target sizes
npx cypress run --spec "cypress/e2e/a11y-target-size.cy.ts"

# Text spacing
npx cypress run --spec "cypress/e2e/a11y-text-spacing.cy.ts"

# Enhanced forms
npx cypress run --spec "cypress/e2e/a11y-forms-enhanced.cy.ts"
```

### Open Cypress UI

```bash
npm run test:a11y:open
```

## 📊 Coverage Summary

### AAA Criteria Coverage

- **Automated**: 16 criteria (35.6%)
- **Manual**: 14 criteria (31.1%)
- **Partial**: 6 criteria (13.3%)
- **Not Applicable**: 9 criteria (20%)

### Key Achievements

✅ **Enhanced Color Contrast**: 7:1 ratio for normal text  
✅ **Keyboard Navigation**: Full keyboard accessibility without exceptions  
✅ **Text Spacing**: Supports WCAG spacing adjustments  
✅ **Target Sizes**: 44x44px minimum for interactive elements  
✅ **Form Accessibility**: Labels, errors, help text, and validation  
✅ **Descriptive Links**: No generic "click here" links  
✅ **Section Headings**: Proper content organization

## 🛠️ Tools Used

- **axe-core**: Automated accessibility testing engine
- **Cypress**: End-to-end testing framework
- **cypress-axe**: Cypress integration for axe-core

## 📖 WCAG Resources

- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [Understanding WCAG](https://www.w3.org/WAI/WCAG22/Understanding/)
- [How to Meet WCAG (AAA)](https://www.w3.org/WAI/WCAG22/quickref/?versions=2.2&levels=aaa)

## 🔍 Regular Testing Schedule

- **Every PR/Commit**: Automated tests run via CI/CD
- **Weekly**: Review of accessibility test results
- **Quarterly**: Full manual accessibility audit
- **Annually**: Third-party accessibility audit (recommended)

## 🐛 Reporting Accessibility Issues

When you find an accessibility issue:

1. Check if it's already covered in our [coverage matrix](./wcag-aaa-coverage.md)
2. Create a GitHub issue with label `accessibility`
3. Include:
   - Which WCAG criterion is violated
   - Current vs. expected behavior
   - Steps to reproduce
   - Severity rating

## 📝 Contributing

When adding new features:

1. ✅ Run automated accessibility tests
2. 📋 Follow [manual testing guide](./manual-testing-guide.md) where applicable
3. 📊 Update coverage matrix if new criteria are addressed
4. 💬 Document any exceptions or limitations

## 📞 Support

For questions about accessibility:
- Review this documentation
- Check WCAG official resources
- Consult with UX/accessibility team

---

*Last Updated: 2026-01-22*  
*WCAG Version: 2.2 Level AAA*
