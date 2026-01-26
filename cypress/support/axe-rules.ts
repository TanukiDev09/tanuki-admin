/// <reference types="cypress" />
/// <reference types="cypress-axe" />

/**
 * WCAG AAA Axe-Core Rules Configuration
 *
 * This file defines specific axe-core rules and configurations for WCAG AAA compliance testing.
 * Using tags instead of specific rules for better compatibility.
 */

export const WCAG_AAA_RULES = {
  // All WCAG AAA tags
  tags: ['wcag2aaa', 'wcag21aaa', 'wcag22aaa', 'best-practice'],
};

/**
 * Enhanced contrast options for AAA compliance
 * AAA Level requires:
 * - 7:1 for normal text
 * - 4.5:1 for large text (18pt+ or 14pt+ bold)
 */
export const CONTRAST_OPTIONS = {
  runOnly: {
    type: 'rule' as const,
    values: ['color-contrast-enhanced'],
  },
};

/**
 * Options for comprehensive AAA testing
 * Let the tags handle which rules to run
 */
export const COMPREHENSIVE_AAA_OPTIONS = {
  runOnly: {
    type: 'tag' as const,
    values: WCAG_AAA_RULES.tags,
  },
};

/**
 * Options for keyboard accessibility testing
 */
export const KEYBOARD_OPTIONS = {
  runOnly: {
    type: 'rule' as const,
    values: ['tabindex', 'aria-hidden-focus'],
  },
};

/**
 * Options for form accessibility testing
 */
export const FORM_OPTIONS = {
  runOnly: {
    type: 'rule' as const,
    values: [
      'label',
      'label-title-only',
      'form-field-multiple-labels',
      'aria-required-attr',
      'autocomplete-valid',
      'select-name',
    ],
  },
};

const axeRulesConfig = {
  WCAG_AAA_RULES,
  CONTRAST_OPTIONS,
  COMPREHENSIVE_AAA_OPTIONS,
  KEYBOARD_OPTIONS,
  FORM_OPTIONS,
};

export default axeRulesConfig;
