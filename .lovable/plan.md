

## Fix: Code Execution-Based Validation

### Problem
The validator compares the user's **source code text** against the challenge's `expected_output` value (e.g. `"5"`). Since the code is never executed, `function sum(a,b){return a+b}\nsum(2,3)` will never string-match `"5"`. Every non-HTML challenge is broken.

### Solution
For JS/Python-style challenges, **execute the user's code** in a sandboxed `Function()` wrapper, capture its return value / console output, and compare *that* against `expected_output`.

### Changes

#### 1. `src/lib/validateChallenge.ts` — Add JS execution path

Add a new function `executeAndValidate(userCode, expectedOutput)`:
- Wrap user code in a `Function` constructor with a captured `console.log` override
- Execute it, collect all `console.log` outputs into an array
- Also capture the return value of the last expression
- Compare the collected output (trimmed) against `expectedOutput` (trimmed, case-insensitive)
- Catch runtime errors and return them as validation errors
- Keep the existing DOM-based path for HTML/CSS challenges untouched

Update `validateChallengeDetailed` to choose the execution path when `domChecks` is absent — instead of the current text-normalization comparison.

#### 2. `src/components/workspace/TerminalPanel.tsx` — Pass correct spec

Update the call to use the new execution-based validation. The `expectedCode` field becomes irrelevant for JS challenges; instead pass `expectedOutput` as the target comparison value. Display captured console output in the terminal lines so the user sees what their code actually produced (e.g. `> Output: 5`).

#### 3. Security note

`new Function()` runs in the browser's JS context. This is acceptable here since the user is only running their own code in their own browser — same as browser DevTools. No server execution is involved.

### What stays untouched
- DOM-based validation path (HTML/CSS challenges) — preserved exactly
- Store, routing, auth, celebration, XP logic — all unchanged
- Database schema — no changes needed

