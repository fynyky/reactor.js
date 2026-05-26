## Git Workflow

Always work on a feature branch. Never commit or push directly to 
master, main, or any release branch.

Branch naming: `claude/<short-description>`
e.g. `claude/fix-login-bug`, `claude/add-payment-endpoint`

Workflow for every task:
1. `git checkout master && git pull`
2. `git checkout -b claude/<description>`
3. Make changes and commit
4. `git push -u origin claude/<description>`
5. `gh pr create`

Never force push. Never delete branches. Never merge your own PRs.