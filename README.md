# KodAI Workspace

A web-based coding workspace for students to solve programming challenges, run code live in the browser UI, and validate solutions automatically.

## Core features

### 1) Challenge system
Each challenge includes:
- **title / description**
- **difficulty + XP reward**
- **expected output** (or markup expectations for HTML/CSS challenges)

User progress is stored so completed challenges can award XP only once.

### 2) Live code execution
When a student clicks **Run**, the app sends the editor code to a remote execution engine (currently Piston) and captures:
- `stdout` (normal output)
- `stderr` (runtime/compiler errors)

The Terminal panel displays:
- the “Running code…” status
- program output or runtime errors
- success/failure feedback

### 3) Output-based validation (important)
Validation should be based on **runtime output**, not by comparing the student’s source code text.

The project contains:
- A detailed validator that executes code and compares `stdout` to the expected output.
- Markup validation for HTML/CSS challenges using DOM parsing and required selectors.

### 4) XP + progress tracking
On successful validation:
- the student earns XP (if not already completed)
- progress is saved (e.g., challenge completion timestamp + submitted code)

## Tech stack
- Vite + React + TypeScript
- Monaco Editor
- Tailwind + shadcn-ui
- Supabase (auth/profile/progress storage)

## Development

### Install
```bash
npm install
```

### Run locally
```bash
npm run dev
```

### Build
```bash
npm run build
```

## Environment variables
Create a `.env` file (or use your hosting provider’s env settings). At minimum you will need your Supabase keys.

If you use a hosted Piston instance that requires authorization, you may also need an API key/token.

## Notes on code execution providers
Public execution APIs may require an API key or may impose limits. For production use, consider running your own execution service instance.

## License
Add a license file if you plan to open-source this project.