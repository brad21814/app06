---
name: git_commit_push
description: specific instructions on how to use git to add, commit and push changes
---

# Git Commit and Push Skill

This skill provides a standardized way to add, commit, and push changes to the remote repository.

## Instructions

1.  **Check Status**: Always start by checking the current status of the repository to understand what changes are pending.
    ```bash
    git status
    ```

2.  **Stage Changes**: Stage all changes.
    ```bash
    git add .
    ```

3.  **Commit Changes**: Commit the staged changes with a descriptive message.
    -   The message should be concise and use the imperative mood (e.g., "Fix bug" not "Fixed bug").
    -   If the changes are significant, provide a more detailed description in the body of the commit message.
    ```bash
    git commit -m "Your descriptive commit message here"
    ```

4.  **Push Changes**: Push the commits to the remote repository.
    ```bash
    git push
    ```

## Error Handling

-   If `git commit` fails because there are no changes to commit, checking `git status` first should prevent this.
-   If `git push` fails due to conflicts, you may need to `git pull` first, resolve conflicts, and then try again.
