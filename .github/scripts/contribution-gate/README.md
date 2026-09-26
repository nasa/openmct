# Contribution gate

Automates everything between someone opening a contribution and a maintainer being asked to read it.
The process it enforces is described for contributors in
[CONTRIBUTING.md](../../../CONTRIBUTING.md#the-contribution-gate).

The aim is that the team is notified exactly once per pull request: when it is compliant, its checks
pass, and every AI review comment has been answered.

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

- __Copilot__ is the review the gate requests and pays for. Only a Copilot review satisfies the wait
  at stage 5, which is why `AI_REVIEWER_LOGINS` is a narrower list than `AUTOMATED_REVIEWER_LOGINS`.
- __CodeQL__ (`github-advanced-security[bot]`) posts its own security findings. The gate never requests
  it, but a contributor must still reply to each finding, and its `Analyze` check must pass whenever it
  runs. CodeQL skips pull requests that only touch specs, documentation or configuration, so it is in
  `CHECKS_REQUIRED_WHEN_REPORTED` rather than `REQUIRED_CHECK_NAMES`: a check that never reports would
  otherwise leave those pull requests waiting forever.

Two workflows drive it:

- `.github/workflows/contribution-gate.yml` — everything, under `pull_request_target` so it can act on
  pull requests from forks. **It must never check out or run the pull request's code.**
- `.github/workflows/contribution-gate-listener.yml` — catches review replies, which reach Actions with
  a read-only token, and passes the pull request number to the gate through an artifact.

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

## Before going live

1. Confirm the token can do these three things, which are the parts we could not verify in advance.
   The workflow logs a clear failure for each:
   - request `copilot-pull-request-reviewer[bot]` as a reviewer,
   - request the `openmct-maintainers` team as a reviewer,
   - resolve a review thread through the GraphQL `resolveReviewThread` mutation.

   If `GITHUB_TOKEN` cannot, create a GitHub App, store its credentials as organization secrets and
   mint a token with `actions/create-github-app-token`. That also settles which account Copilot bills.
2. Enable Copilot code review for the repository, including for users without a licence, and set a
   monthly budget. Each review costs real money, which is why the gate asks for one only once, and
   only after the checks pass.
3. Make sure no repository rule set also requests Copilot automatically, or every pull request is
   reviewed, and paid for, twice.
4. Set "Fork pull request workflows from outside collaborators" to require approval only for
   contributors new to GitHub, so CI runs without a maintainer clicking anything.
5. Create or confirm the team named in `REVIEWER_TEAM_SLUG`.
6. Create the `gate:needs-compliance`, `gate:awaiting-ci`, `gate:ai-review`, `gate:team-review` and
   `gate:ai-review-again` labels, and give them colours that read as a progression. GitHub will
   create any it is asked for that do not exist, but in a default grey.
7. Set `CONTRIBUTION_GATE_DRY_RUN` to `false`.

Expect the first live sweep to find a large backlog of issues that predate the rules, above all bug
reports with no testing instructions. Intake is capped per run, so this arrives over days rather than
all at once, and every one of them gets a reminder before anything is closed.
