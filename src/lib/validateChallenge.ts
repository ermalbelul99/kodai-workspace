/**
 * Robust code validation for the interactive landing page challenge.
 *
 * Strategy: normalise the user's code (strip whitespace, comments,
 * semicolons; canonicalise quotes) then compare against a normalised
 * expected string AND a fallback regex pattern.
 *
 * This ensures variations like:
 *   console.log('Hello')
 *   console.log("Hello");
 *   console.log(  "Hello" )  ;
 * all pass validation.
 */

/** Strip noise so structurally identical code compares equal. */
export function normalizeCode(code: string): string {
  return code
    .replace(/\/\/.*$/gm, '')   // strip single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // strip multi-line comments
    .replace(/\s+/g, '')        // collapse all whitespace
    .replace(/["'`]/g, '"')     // normalise quotes to double
    .replace(/;/g, '')          // strip semicolons
    .toLowerCase();
}

export interface ChallengeSpec {
  /** The canonical correct code (any quote / whitespace style). */
  expectedCode: string;
  /** Optional regex applied to the *normalised* string as a fallback. */
  pattern?: RegExp;
}

/**
 * Validate user code against a challenge specification.
 *
 * @returns `true` when the normalised user code matches
 *          the expected code OR the fallback regex.
 */
export function validateChallenge(
  userCode: string,
  spec: ChallengeSpec,
): boolean {
  const normalised = normalizeCode(userCode);
  const expected = normalizeCode(spec.expectedCode);

  // Primary: exact normalised match
  if (normalised === expected) return true;

  // Fallback: regex on normalised code
  if (spec.pattern && spec.pattern.test(normalised)) return true;

  return false;
}
