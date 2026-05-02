const PISTON_EXECUTE_URL =
  import.meta.env.VITE_PISTON_URL ?? 'https://emkc.org/api/v2/piston/execute';
const MARKUP_LANGUAGES = new Set(['html', 'css']);
const EXECUTION_TIMEOUT_MS = 8_000; // 8 seconds
const MAX_RUNTIME_ERROR_LENGTH = 400;
const MAX_DISPLAYED_MISSING_SELECTORS = 3;

/** Strip noise so structurally identical code compares equal. */
export function normalizeCode(code: string): string {
  return code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, '')
    .replace(/["'`]/g, '"')
    .replace(/;/g, '')
    .toLowerCase();
}

export interface ChallengeSpec {
  /** Legacy field (kept for backwards compatibility). */
  expectedCode?: string;
  /** Preferred field for expected runtime output / expected markup. */
  expectedOutput?: string;
  /** Challenge language route (e.g. javascript, python, html, css). */
  language?: string;
  /** Optional regex fallback used by legacy sync validator. */
  pattern?: RegExp;
  /** Optional selectors for markup challenges. */
  requiredSelectors?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  expected?: string;
  actual?: string;
}

interface PistonExecuteResult {
  stdout: string;
  stderr: string;
  error?: string;
}

function normalizeOutput(value: string): string {
  return value.trim().toLowerCase();
}

function toUserRuntimeError(stderr: string): string {
  const compact = stderr.trim();
  if (!compact) return 'Runtime error occurred while executing your code.';
  if (compact.length <= MAX_RUNTIME_ERROR_LENGTH) return compact;
  return `${compact.slice(0, MAX_RUNTIME_ERROR_LENGTH)}…`;
}

function getExpectedValue(spec: ChallengeSpec): string {
  return (spec.expectedOutput ?? spec.expectedCode ?? '').trim();
}

function isMarkupLanguage(language?: string): boolean {
  if (!language) return false;
  return MARKUP_LANGUAGES.has(language.toLowerCase());
}

/**
 * Maps platform language identifiers to the Piston runtime names.
 * The local Docker instance uses different names than the public emkc.org API
 * for some languages (e.g. JavaScript runs under the "node" runtime).
 */
const PISTON_LANGUAGE_MAP: Record<string, string> = {
  javascript: 'node',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  csharp: 'csharp.net',
  'c#': 'csharp.net',
  cpp: 'gcc',
  'c++': 'gcc',
  go: 'go',
  rust: 'rust',
};

function toPistonLanguage(language: string): string {
  return PISTON_LANGUAGE_MAP[language.toLowerCase()] ?? language;
}

async function executeWithPiston(userCode: string, language: string): Promise<PistonExecuteResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT_MS);

  try {
    const response = await fetch(PISTON_EXECUTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        language: toPistonLanguage(language),
        version: '*',
        files: [{ content: userCode }],
      }),
    });

    if (!response.ok) {
      return {
        stdout: '',
        stderr: '',
        error: `Execution service returned HTTP ${response.status}.`,
      };
    }

    const data: unknown = await response.json();
    const run = typeof data === 'object' && data !== null && 'run' in data
      ? (data as { run?: { stdout?: string; stderr?: string } }).run
      : undefined;

    if (!run) {
      return {
        stdout: '',
        stderr: '',
        error: 'Execution service returned an invalid response.',
      };
    }

    return {
      stdout: typeof run.stdout === 'string' ? run.stdout : '',
      stderr: typeof run.stderr === 'string' ? run.stderr : '',
    };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === 'AbortError';
    return {
      stdout: '',
      stderr: '',
      error: isAbort
        ? 'Execution timed out. Please try again.'
        : 'Execution service is temporarily unavailable. Please try again.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

function getExpectedSelectors(expectedMarkup: string, spec: ChallengeSpec): string[] {
  if (spec.requiredSelectors && spec.requiredSelectors.length > 0) {
    return spec.requiredSelectors;
  }

  const expectedDoc = new DOMParser().parseFromString(expectedMarkup, 'text/html');
  const elements = Array.from(expectedDoc.body.querySelectorAll('*'));
  const selectors = new Set<string>();

  for (const element of elements) {
    const tag = element.tagName.toLowerCase();
    selectors.add(tag);

    if (element.id) selectors.add(`#${element.id}`);

    const classList = Array.from(element.classList);
    for (const className of classList) {
      selectors.add(`.${className}`);
      selectors.add(`${tag}.${className}`);
    }
  }

  return Array.from(selectors);
}

function validateMarkupStructure(userCode: string, expectedMarkup: string, spec: ChallengeSpec): ValidationResult {
  try {
    const userDoc = new DOMParser().parseFromString(userCode, 'text/html');
    const selectors = getExpectedSelectors(expectedMarkup, spec);

    if (selectors.length === 0) {
      return {
        isValid: false,
        message: 'Markup validation failed: no expected DOM selectors were provided.',
      };
    }

    const missingSelectors = selectors.filter((selector) => !userDoc.querySelector(selector));
    if (missingSelectors.length > 0) {
      return {
        isValid: false,
        message: `Missing expected element(s): ${missingSelectors.slice(0, MAX_DISPLAYED_MISSING_SELECTORS).join(', ')}`,
      };
    }

    return {
      isValid: true,
      message: 'Markup structure is valid.',
    };
  } catch {
    return {
      isValid: false,
      message: 'Invalid HTML/CSS content. Please check your markup.',
    };
  }
}

/**
 * Detailed async validator (new primary architecture).
 * - Programming languages: remote execution via Piston.
 * - HTML/CSS: parse into virtual DOM and validate via selectors.
 */
export async function validateChallengeDetailed(
  userCode: string,
  spec: ChallengeSpec,
): Promise<ValidationResult> {
  const expected = getExpectedValue(spec);
  const language = (spec.language ?? 'javascript').toLowerCase();

  if (!userCode.trim()) {
    return { isValid: false, message: 'Please provide code before running validation.' };
  }

  if (!expected) {
    return { isValid: false, message: 'Challenge expected output is missing.' };
  }

  if (isMarkupLanguage(language)) {
    return validateMarkupStructure(userCode, expected, spec);
  }

  const execution = await executeWithPiston(userCode, language);

  if (execution.error) {
    return { isValid: false, message: execution.error };
  }

  const stderr = execution.stderr.trim();
  if (stderr) {
    return {
      isValid: false,
      message: toUserRuntimeError(stderr),
      expected,
    };
  }

  const actual = execution.stdout.trim();
  const matches = normalizeOutput(actual) === normalizeOutput(expected);

  if (!matches) {
    return {
      isValid: false,
      message: 'Output did not match expected output.',
      expected,
      actual,
    };
  }

  return {
    isValid: true,
    message: 'Output matches expected output.',
    expected,
    actual,
  };
}

/**
 * Legacy sync validator kept for backwards compatibility with existing callers.
 * Prefer `validateChallengeDetailed` for execution-based validation.
 */
export function validateChallenge(
  userCode: string,
  spec: ChallengeSpec,
): boolean {
  if (isMarkupLanguage(spec.language)) {
    return validateMarkupStructure(userCode, getExpectedValue(spec), spec).isValid;
  }

  const normalised = normalizeCode(userCode);
  const expected = normalizeCode(getExpectedValue(spec));

  if (normalised === expected) return true;
  if (spec.pattern && spec.pattern.test(normalised)) return true;

  return false;
}
