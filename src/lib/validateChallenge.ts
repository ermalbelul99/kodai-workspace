/**
 * Dual-path code validation engine.
 *
 * PATH 1 — Programming languages (JS, Python, etc.):
 *   Sends code to the public Piston API for real execution,
 *   then compares stdout against expectedOutput.
 *
 * PATH 2 — HTML/CSS:
 *   Parses user code with DOMParser and checks the DOM tree
 *   for expected elements/classes via querySelector.
 */

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

// Languages that should be executed remotely via Piston
const EXECUTABLE_LANGUAGES = ['javascript', 'python', 'typescript', 'java', 'c', 'cpp', 'ruby', 'go', 'rust'];

export interface ValidationResult {
  passed: boolean;
  /** Actual output from execution (stdout) or DOM check description */
  output?: string;
  /** Error message (stderr, network failure, parse error) */
  error?: string;
}

// ─── PATH 1: Remote Execution via Piston ────────────────────────────

async function executeWithPiston(
  userCode: string,
  language: string,
  expectedOutput: string,
): Promise<ValidationResult> {
  try {
    const res = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: language === 'typescript' ? 'typescript' : language,
        version: '*',
        files: [{ content: userCode }],
      }),
    });

    if (!res.ok) {
      return {
        passed: false,
        error: `Execution service returned ${res.status}. Please try again.`,
      };
    }

    const data = await res.json();
    const stdout = (data?.run?.stdout ?? '').trim();
    const stderr = (data?.run?.stderr ?? '').trim();

    // If there's a runtime error, report it
    if (stderr) {
      return { passed: false, output: stdout || undefined, error: stderr };
    }

    // Case-insensitive comparison of trimmed output
    const passed = stdout.toLowerCase() === expectedOutput.trim().toLowerCase();

    return { passed, output: stdout };
  } catch (err) {
    return {
      passed: false,
      error: `Could not reach the execution service. ${err instanceof Error ? err.message : 'Please check your connection.'}`,
    };
  }
}

// ─── PATH 2: Virtual DOM Parsing for HTML/CSS ───────────────────────

function validateHTML(
  userCode: string,
  expectedOutput: string,
): ValidationResult {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(userCode, 'text/html');

    // Check for parser errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      return { passed: false, error: 'HTML parsing failed. Check your syntax.' };
    }

    // expectedOutput can be:
    //   1. A CSS selector — we check if the element exists
    //   2. A "selector::textContent" pair — we check element + text
    //   3. Multiple checks separated by "&&"
    const checks = expectedOutput.split('&&').map((s) => s.trim());
    const failures: string[] = [];

    for (const check of checks) {
      // Format: "selector::expectedText" or just "selector"
      const parts = check.split('::');
      const selector = parts[0].trim();
      const expectedText = parts[1]?.trim();

      const el = doc.querySelector(selector);

      if (!el) {
        failures.push(`Missing element: "${selector}"`);
        continue;
      }

      if (expectedText) {
        const actualText = (el.textContent ?? '').trim();
        if (actualText.toLowerCase() !== expectedText.toLowerCase()) {
          failures.push(
            `Element "${selector}" has text "${actualText}", expected "${expectedText}"`,
          );
        }
      }

      // Also check for Tailwind / class-based validations
      // Format: "selector.className" — already handled by querySelector
    }

    if (failures.length > 0) {
      return { passed: false, error: failures.join('\n') };
    }

    return { passed: true, output: 'HTML structure validated successfully.' };
  } catch (err) {
    return {
      passed: false,
      error: `HTML validation error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

// ─── Public API ─────────────────────────────────────────────────────

export interface ChallengeSpec {
  expectedCode: string; // kept for backward compat (unused in new paths)
  expectedOutput?: string;
  language?: string;
  pattern?: RegExp; // legacy fallback
}

/**
 * Validate user code using real execution (Piston) or DOM parsing.
 * Falls back to normalized string matching for unknown challenge types.
 */
export async function validateChallenge(
  userCode: string,
  spec: ChallengeSpec,
): Promise<ValidationResult> {
  const language = (spec.language ?? 'javascript').toLowerCase();
  const expectedOutput = spec.expectedOutput ?? spec.expectedCode;

  // PATH 1: Executable languages → Piston API
  if (EXECUTABLE_LANGUAGES.includes(language)) {
    return executeWithPiston(userCode, language, expectedOutput);
  }

  // PATH 2: HTML / CSS → DOM parsing
  if (language === 'html' || language === 'css') {
    return validateHTML(userCode, expectedOutput);
  }

  // FALLBACK: Legacy normalized string matching for unknown types
  return legacyValidation(userCode, spec);
}

// ─── Legacy fallback (preserved for backward compatibility) ─────────

function normalizeCode(code: string): string {
  return code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, '')
    .replace(/["'`]/g, '"')
    .replace(/;/g, '')
    .toLowerCase();
}

function legacyValidation(
  userCode: string,
  spec: ChallengeSpec,
): ValidationResult {
  const normalised = normalizeCode(userCode);
  const expected = normalizeCode(spec.expectedCode);

  if (normalised === expected) {
    return { passed: true, output: 'Code matches expected output.' };
  }

  if (spec.pattern && spec.pattern.test(normalised)) {
    return { passed: true, output: 'Code matches expected pattern.' };
  }

  return { passed: false, error: 'Output does not match expected result.' };
}
