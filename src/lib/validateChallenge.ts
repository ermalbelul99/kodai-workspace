/**
 * Code validation for KodAI challenges.
 *
 * Two strategies:
 * 1. **Text-based** (JS/Python): normalise → compare / regex.
 * 2. **DOM-based** (HTML/CSS): parse with DOMParser → query elements,
 *    check classes, attributes, and content.
 *
 * The public `validateChallenge` signature returns `boolean` so the
 * rest of the app is unaffected.  Use `validateChallengeDetailed` when
 * you need per-check error messages.
 */

// ---------------------------------------------------------------------------
// Text normalisation (kept for non-HTML challenges)
// ---------------------------------------------------------------------------

export function normalizeCode(code: string): string {
  return code
    .replace(/\/\/.*$/gm, '')          // single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')  // multi-line comments
    .replace(/\s+/g, '')               // collapse whitespace
    .replace(/["'`]/g, '"')            // normalise quotes
    .replace(/;/g, '')                 // strip semicolons
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single DOM-level assertion. */
export interface DomCheck {
  /** CSS selector that must match at least one element. */
  selector?: string;
  /** If provided, at least one matched element must contain this class substring (e.g. "md:"). */
  classContains?: string;
  /** If provided, the text content of a matched element must include this string (case-insensitive). */
  textContains?: string;
  /** Human-readable failure message shown to the user. */
  errorMessage: string;
}

export interface ChallengeSpec {
  /** Canonical correct code (any quote / whitespace style). */
  expectedCode: string;
  /** Regex fallback applied to the *normalised* string. */
  pattern?: RegExp;
  /**
   * DOM-based checks for HTML/CSS challenges.
   * When present the validator parses the code with DOMParser and runs
   * every check; text-based matching is skipped.
   */
  domChecks?: DomCheck[];
}

export interface ValidationResult {
  passed: boolean;
  /** Non-empty only when `passed` is false. */
  errors: string[];
}

// ---------------------------------------------------------------------------
// DOM validation
// ---------------------------------------------------------------------------

function validateDom(html: string, checks: DomCheck[]): ValidationResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const errors: string[] = [];

  for (const check of checks) {
    // If no selector, skip (safety)
    if (!check.selector) continue;

    const elements = doc.querySelectorAll(check.selector);

    if (elements.length === 0) {
      errors.push(check.errorMessage);
      continue;
    }

    // Optional: at least one element's className must contain the substring
    if (check.classContains) {
      const found = Array.from(elements).some((el) =>
        el.className.includes(check.classContains!),
      );
      if (!found) {
        errors.push(check.errorMessage);
        continue;
      }
    }

    // Optional: at least one element's textContent must include the string
    if (check.textContains) {
      const needle = check.textContains.toLowerCase();
      const found = Array.from(elements).some((el) =>
        (el.textContent ?? '').toLowerCase().includes(needle),
      );
      if (!found) {
        errors.push(check.errorMessage);
      }
    }
  }

  return { passed: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Text-based validation (JS / Python / generic)
// ---------------------------------------------------------------------------

function validateText(userCode: string, spec: ChallengeSpec): boolean {
  const normalised = normalizeCode(userCode);
  const expected = normalizeCode(spec.expectedCode);

  if (normalised === expected) return true;
  if (spec.pattern && spec.pattern.test(normalised)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detailed validation — returns per-check error messages.
 */
export function validateChallengeDetailed(
  userCode: string,
  spec: ChallengeSpec,
): ValidationResult {
  // DOM path
  if (spec.domChecks && spec.domChecks.length > 0) {
    return validateDom(userCode, spec.domChecks);
  }

  // Text path
  const passed = validateText(userCode, spec);
  return {
    passed,
    errors: passed ? [] : [`Expected output does not match.`],
  };
}

/**
 * Simple boolean validation — backward-compatible.
 */
export function validateChallenge(
  userCode: string,
  spec: ChallengeSpec,
): boolean {
  return validateChallengeDetailed(userCode, spec).passed;
}
