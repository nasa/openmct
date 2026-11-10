# Fork CI approval

GitHub holds every workflow run from a fork until a maintainer clicks "Approve and run". This
approves those runs automatically, unless the pull request changes a file listed in
[`.github/CODEOWNERS`](../../CODEOWNERS). Those pull requests stay held, with a comment naming the
files, so a maintainer looks before anything new runs in CI.

| File | Job |
| --- | --- |
| `approveForkRuns.js` | Entry point `run()`. Finds held runs, fetches the changed files, approves or comments. |
| `approvalDecision.js` | The decision, as a pure function. Holds whenever it is unsure. |
| `codeowners.js` | Reads the patterns in CODEOWNERS and matches paths against them, by `.gitignore` rules. |

The workflow is `.github/workflows/fork-ci-approval.yml`.

## Why this is safe

- **It runs master's copy of itself.** It runs under `pull_request_target`, which always uses the
  target branch's workflow, and it reads `CODEOWNERS` from that same checkout. A pull request cannot
  change how it is judged, and a pull request that edits either file is itself a change to
  `.github/`, so it is held.
- **It never runs the pull request's code.** It reads the pull request only through the API.
- **It holds when unsure.** No `CODEOWNERS`, a pull request too large for GitHub to list in full, or
  GitHub refusing an approval all leave the runs held, which is how GitHub treats every fork anyway.
- **A rename counts at both ends**, so moving a workflow out of `.github/` is held too.

The approved runs are fork runs: GitHub gives them a read-only token and no secrets whatever their
workflow files say. What a maintainer is protecting by looking at the held ones is what runs on the
project's runners, and what reaches master.

## What it relies on

- The repository setting **"Require approval for all outside contributors"**. Relax it and GitHub
  runs fork CI itself, before this workflow sees the pull request.
- Its token's `actions: write` permission, which is what lets it approve runs. This was tested
  against a held run on this repository before it was written.

It has only been seen approving runs for first-time contributors. GitHub documents the approval API
as being for first-time contributors; if it refuses a returning contributor's run, the pull request
gets a comment asking a maintainer to approve it.

## When it runs

- When a fork pull request is opened, reopened or pushed to.
- Every 15 minutes, for any held run GitHub had not created yet when the event fired.
- On demand, from the Actions tab, for one pull request or all of them.

## Running the tests

```sh
npm run test:fork-ci-approval
```

The tests check the matching against the real `CODEOWNERS`, so an edit there that would let a
sensitive file through fails them.
