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
// Execution-based validation (JS challenges)
// ---------------------------------------------------------------------------

export interface ExecutionResult {
  passed: boolean;
  errors: string[];
  /** All console.log output captured during execution. */
  consoleOutput: string[];
  /** The return value of the last expression (stringified). */
  returnValue: string | null;
}

function executeAndValidate(userCode: string, expectedOutput: string): ExecutionResult {
  const consoleOutput: string[] = [];
  let returnValue: string | null = null;

  try {
    // Override console.log to capture output
    const wrappedCode = `
      var __logs = [];
      var __origLog = console.log;
      console.log = function() {
        var args = Array.prototype.slice.call(arguments);
        __logs.push(args.map(String).join(' '));
        __origLog.apply(console, arguments);
      };
      try {
        ${userCode}
      } finally {
        console.log = __origLog;
      }
    `;

    // Use Function constructor to execute in isolated scope
    const fn = new Function(wrappedCode + '\nreturn __logs;');
    const logs: string[] = fn();
    consoleOutput.push(...logs);

    // Also try evaluating the last expression for a return value
    try {
      const lines = userCode.trim().split('\n');
      const lastLine = lines[lines.length - 1].trim();
      // If last line looks like an expression (not a declaration), evaluate the whole thing
      if (lastLine && !lastLine.startsWith('function ') && !lastLine.startsWith('const ') &&
          !lastLine.startsWith('let ') && !lastLine.startsWith('var ') && !lastLine.startsWith('//')) {
        const evalFn = new Function(`${userCode}\nreturn ${lastLine};`);
        const result = evalFn();
        if (result !== undefined) {
          returnValue = String(result);
        }
      }
    } catch {
      // Last-line eval failed — that's fine, rely on console output
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      passed: false,
      errors: [`Runtime error: ${message}`],
      consoleOutput,
      returnValue: null,
    };
  }

  // Compare: check console output first, then return value
  const expected = expectedOutput.trim().toLowerCase();
  const allOutput = consoleOutput.join('\n').trim().toLowerCase();

  if (allOutput === expected || (returnValue !== null && returnValue.trim().toLowerCase() === expected)) {
    return { passed: true, errors: [], consoleOutput, returnValue };
  }

  const actual = consoleOutput.length > 0 ? consoleOutput.join('\n') : (returnValue ?? '(no output)');
  return {
    passed: false,
    errors: [`Expected output: "${expectedOutput.trim()}", but got: "${actual}"`],
    consoleOutput,
    returnValue,
  };
}

// ---------------------------------------------------------------------------
// Text-based validation (fallback for non-executable, non-DOM challenges)
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
 * For JS challenges (no domChecks), executes the code and compares output.
 */
export function validateChallengeDetailed(
  userCode: string,
  spec: ChallengeSpec,
): ValidationResult & { consoleOutput?: string[]; returnValue?: string | null } {
  // DOM path (HTML/CSS challenges)
  if (spec.domChecks && spec.domChecks.length > 0) {
    return validateDom(userCode, spec.domChecks);
  }

  // Execution path (JS challenges) — preferred when expectedCode looks like an output value
  const execResult = executeAndValidate(userCode, spec.expectedCode);
  if (execResult.passed) {
    return execResult;
  }

  // Fallback: text-based comparison (for edge cases)
  const textPassed = validateText(userCode, spec);
  if (textPassed) {
    return { passed: true, errors: [], consoleOutput: execResult.consoleOutput, returnValue: execResult.returnValue };
  }

  return execResult;
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
