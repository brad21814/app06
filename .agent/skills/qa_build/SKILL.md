---
name: qa_build
description: Runs the project build process and iteratively fixes any errors that arise, ensuring the application is production-ready.
---

# QA Build and Fix Skill

This skill guides you through the process of building the application and resolving any build errors. It is designed to be an iterative process: running the build, analyzing failures, fixing the underlying code issues, and repeating until success.

## Instructions

1.  **Run Build Command:**
    Execute the build command to compile the project and check for errors.
    ```bash
    npm run build
    ```

2.  **Analyze Build Output:**
    -   **Success:** If the exit code is 0 and the output indicates success (e.g., "Compiled successfully"), no further action is needed. Report success.
    -   **Failure:** If the command fails (exit code non-zero), examine the output for error messages. Look for:
        -   **TypeScript Errors:** typically indicated by `Type error: ...` followed by a file path and line number.
        -   **Linting Errors:** typically indicated by ESLint warnings or errors.
        -   **Module Not Found:** missing imports or incorrect paths.
        -   **Syntax Errors:** invalid syntax in code files.

3.  **Resolve Errors (Iterative Fix):**
    For each error encountered in the output:
    1.  **Identify File and Line:** Locate the exact file path and line number causing the issue.
    2.  **Read Context:** use `view_file` to see the code surrounding the error.
        ```
        view_file(AbsolutePath="/path/to/file", StartLine=..., EndLine=...)
        ```
    3.  **Diagnose Root Cause:** Determine *why* the error is happening.
        -   Is a type missing or mismatched?
        -   Is a property accessed on a possibly undefined object?
        -   Is an import path incorrect?
    4.  **Apply Fix:** Use `replace_file_content` or `multi_replace_file_content` to fix the code.
        -   *TypeScript Fix Tip:* Check `types/firestore.ts` or other type definitions if interfaces are involved.
        -   *Lint Fix Tip:* fix the logic flaw or unused variable, or disable if unavoidable.
    5.  **Re-run Build & Verify (Unit Step):** 
        IMMEDIATELY after applying a fix, run `npm run build` *again* to verify the fix worked and check for next errors.
        -   **Verify Fix:** Confirm the original error is resolved.
        -   **Check for Regressions:** Ensure no *new* errors were introduced by your change.
        -   **Iterate:** If new errors appear, assess if they are minor consequences to fix forward, or if the change was incorrect (in which case, undo and try a different approach).

4.  **Repeat Until Clean:**
    Continue this cycle (Identify -> Fix -> Verify) one error at a time until the build completes successfully (exit code 0).

## Common Issues & Fixes
-   **Duplicate Identifier in Object Literal:** TypeScript forbids `{ id: ..., ...data }` if `data` also has `id`. **Fix:** Cast `data` to exclude `id` (e.g., `as Omit<Type, 'id'>`).
-   **Middleware Deprecation:** Next.js middleware conventions change. Check `next.config.ts` or `middleware.ts` against latest docs if warnings persist.
-   **Missing Module:** Ensure `@types/...` packages are installed if missing for libraries.
