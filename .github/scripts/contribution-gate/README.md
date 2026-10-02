# Contribution gate

Automates everything between someone opening a contribution and a maintainer being asked to read it.
The process it enforces is described for contributors in
[CONTRIBUTING.md](../../../CONTRIBUTING.md#the-contribution-gate).

The aim is that the team is notified exactly once per pull request: when it is compliant, its checks
pass, and every automated review comment has been answered.

## How it fits together

| File | Job |
| --- | --- |
| `config.js` | Every policy decision: deadlines, labels, required checks, required issue sections. Change the process here. |
| `evaluate.js` | The state machine. Decides which stage a contribution is at and performs the actions that stage needs. Entry point `run()`. |
| `trigger.js` | Turns a GitHub event into a decision about what to look at. |
| `fetchContext.js` | Reads contributions through the API. Metadata only; it never checks out contributed code. |
| `gateActions.js` | Every write the gate makes, and the one place dry-run mode stops. |
| `prCompliance.js`, `issueCompliance.js` | The rules, as pure functions returning what is missing. |
| `markdownSections.js`, `globMatch.js` | Reading Issue Form answers, and matching file paths. |
| `reviewThreads.js`, `checkStatus.js` | Which automated-reviewer comments are answered, and whether CI has passed. |
| `deadlines.js` | The clock: when a contribution runs out of time, and who is exempt. |
| `feedbackComment.js`, `stateMarker.js` | The single sticky comment, and the state hidden inside it. |

State lives in that sticky comment, in an HTML comment marker, so the gate needs no database. The
`gate:*` labels show the current stage.

Two reviewers comment without a person asking, and the gate treats them differently:

- __The AI reviewer__ (Copilot, in the code today) is **switched off**. See "The AI review stage"
  below. When it is on, only its review satisfies the wait at stage 5, which is why
  `AI_REVIEWER_LOGINS` is a narrower list than `AUTOMATED_REVIEWER_LOGINS`.
- __CodeQL__ (`github-advanced-security[bot]`) posts its own security findings. The gate never requests
  it, but a contributor must still reply to each finding, and its `Analyze` check must pass whenever it
  runs. CodeQL skips pull requests that only touch specs, documentation or configuration, so it is in
  `CHECKS_REQUIRED_WHEN_REPORTED` rather than `REQUIRED_CHECK_NAMES`: a check that never reports would
  otherwise leave those pull requests waiting forever.

Two workflows drive it:

- `.github/workflows/contribution-gate.yml` — everything, under `pull_request_target` so it can act on
  pull requests from forks. **It must never check out or run the pull request's code.**
- `.github/workflows/contribution-gate-listener.yml` — runs when someone replies to a review comment.
  Those events reach Actions with a read-only token on a fork's pull request, so it does nothing but
  finish, which wakes the gate with the permissions it needs. The gate finds the pull request from the
  branch the run was for.

Resolving a review thread fires no GitHub Actions event at all, so a 30-minute schedule catches threads
resolved without a reply. A daily schedule sends reminders, closes contributions that have run out of
time, and introduces up to `MAXIMUM_INTAKE_PER_SWEEP` new ones.

## Running the tests

```sh
npm run test:contribution-gate
```

These cover the rules, the clock, the marker and the trigger routing. They make no network calls.

## Dry-run mode

The gate changes nothing unless the repository variable `CONTRIBUTION_GATE_DRY_RUN` is set to exactly
`false`. Until then it logs each action it would take, prefixed `Gate (dry run, no change made)`.

To see what it would do to the whole backlog, run the workflow manually with no contribution number.
To look at one contribution, pass its number.

## The AI review stage

It is **off**. The gate goes from "checks pass" straight to asking the team, after any CodeQL finding
has been answered. Set the repository variable `CONTRIBUTION_GATE_AI_REVIEW` to `true` to turn it on,
but only once an AI reviewer really works, because the stage as written is for Copilot and Copilot has
three traps:

- **The API silently drops a review request it will not honour.** It returns success and records
  nothing, for instance when the account has no Copilot entitlement. The gate therefore reads every
  request back, and skips the stage rather than waiting for a review nobody asked for.
- **The identity you request is not the identity the review is posted under.** The request is for
  `Copilot` (`COPILOT_REVIEWER_LOGIN`); the review arrives as `copilot-pull-request-reviewer[bot]`.
- **A review requested with `GITHUB_TOKEN` is billed to, and needs the entitlement of, a bot with no
  seat.** Expect it to be dropped, and plan for a token that belongs to a licensed account.

To use a different AI reviewer, add its bot login to `AI_REVIEWER_LOGINS` and replace
`requestAiReview` in `gateActions.js`. The repository rule set "Copilot review for default branch"
also requests Copilot on its own; remove it before turning this stage on, or reviews are paid for
twice.

## Branch protection

Branch protection on `master` requires a status check named `Check Milestone`, which PR Cop used to
produce. The gate now publishes it itself (`MILESTONE_CHECK_NAME`): passing when the pull request has a
milestone or the `no milestone` label, which the gate adds once the contribution rules are met. It is
published by the gate rather than a workflow because a label added with `GITHUB_TOKEN` does not start
new workflow runs.

The gate also waits for these checks, which are named in `config.js` and must keep matching `pr.yml`:
`lint`, `unit-test`, `e2e-ci (shard N/4)` and `visual-a11y-ci (shard N/2)`. The two visual shards have
their own names so that a failing shard cannot hide behind a passing one.

## Before going live

1. Create the team named in `REVIEWER_TEAM_SLUG`, and check the token can request it. The gate reads
   the request back and, if the team is not on the pull request afterwards, posts a comment mentioning
   the team instead, so a person is told either way.
2. Check the token can resolve a review thread through the GraphQL `resolveReviewThread` mutation. It
   matters only once CodeQL has commented on a pull request.
3. Set "Fork pull request workflows from outside collaborators" to require approval only for
   contributors new to GitHub, so CI runs without a maintainer clicking anything.
4. Create the `gate:needs-compliance`, `gate:awaiting-ci`, `gate:automated-review` and
   `gate:team-review` labels, and give them colours that read as a progression. GitHub will create any
   it is asked for that do not exist, but in a default grey.
5. Run the workflow manually with `CONTRIBUTION_GATE_DRY_RUN` unset and read what it says it would do
   to the open backlog.
6. Set `CONTRIBUTION_GATE_DRY_RUN` to `false`.

Expect the first live sweep to find a large backlog of issues that predate the rules, above all bug
reports with no testing instructions. Intake is capped per run, so this arrives over days rather than
all at once, and every one of them gets a reminder before anything is closed.
