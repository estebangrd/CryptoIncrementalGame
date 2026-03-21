---
argument-hint: <bug description>
description: Autonomous TDD bug-fix workflow. Reads specs, writes a failing test, diagnoses root cause, fixes it, and commits.
allowed-tools: Bash(npm test:*), Bash(git add:*), Bash(git commit:*), Bash(git status:*), Read, Write, Edit
---

I have a bug: $ARGUMENTS

Follow this autonomous TDD workflow:

1. Read the relevant spec in ./specs/ and source code to understand expected behavior.
2. Write a focused failing test that reproduces the exact bug — run `npm test` to confirm it fails with the expected symptom.
3. Diagnose the root cause by tracing the code path.
4. Implement the minimal fix.
5. Run `npm test` — if any test fails, debug and fix, repeat up to 5 times.
6. Once all tests pass, update the relevant spec file to document the edge case.
7. Create a conventional commit with the fix and spec update.

Do not ask me questions — make reasonable assumptions and document them in the commit message.
