# Contribution gate

Automates everything between someone opening a contribution and a maintainer being asked to read it.
The process it enforces is described for contributors in
[CONTRIBUTING.md](../../../CONTRIBUTING.md#the-contribution-gate-pilot).

**It is in a pilot.** It runs alongside PR Cop and the existing templates, and acts only on issues and
pull requests a maintainer has labelled `new-workflow-candidate`. Everything else is left exactly as it
was. See [The pilot](#the-pilot).

The aim is that the team is notified exactly once per pull request: when it is compliant, its checks
pass, and every automated review comment has been answered.

## How it fits together

| File | Job |
| --- | --- |
| `config.js` | Every policy decision: deadlines, labels, required checks, required issue sections. Change the process here. |
| `evaluate.js` | The state machine. Decides which stage a contribution is at and performs the actions that stage needs. Entry point `run()`. |
| `trigger.js` | Turns a GitHub event into a decision about what to look at. |
| `fetchContext.js` | Reads contributions through the API. Metadata only; it never checks out contributed code. |
| `gateActions.js` | Every write the gate makes, each one logged, so a run's log lists what it changed. |
| `prCompliance.js`, `issueCompliance.js` | The rules, as pure functions returning what is missing. |
| `markdownSections.js`, `globMatch.js` | Reading issue and pull request sections, and matching file paths. |
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
resolved without a reply. A daily schedule sends reminders and closes contributions that have run out
of time.

## Running the tests

```sh
npm run test:contribution-gate
```

These cover the rules, the clock, the marker and the trigger routing. They make no network calls.

## The pilot

The gate acts only on contributions carrying `PILOT_LABEL` (`new-workflow-candidate`). Outside
contributors cannot add labels, so only a maintainer can opt something in. Adding the label starts the
gate on it straight away; removing it stops the gate, but leaves its labels and comment where they are.

While it is in the pilot:

- **PR Cop keeps running** on every pull request, candidates included. Both publish the required
  `Check Milestone` check by the same rule, so they never disagree. PR Cop's other checks are not
  required, and on a candidate its `Check type Label` can stay red until the next push, because the
  gate adds that label with a token whose events do not re-run workflows.
- **The current issue and pull request templates stay.** The gate reads them as they are: the
  enhancement template's own headings count, and it never asks a contributor to tick the checklist
  items about the type label or the milestone, because it sets those itself
  (`CHECKLIST_ITEMS_HANDLED_BY_THE_GATE`). Testing instructions can be added to the issue as a comment.
- **Nothing outside the pilot is closed.** The daily sweep looks only at labelled contributions, so
  there is no backlog to work through.

To look at one contribution on demand, run the workflow manually with its number. Every action the
gate takes is logged as a line starting `Gate:`.

To try the process on an issue as well as a pull request, label the issue.

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

Branch protection on `master` requires a status check named `Check Milestone`, which PR Cop produces.
The gate publishes it too, on the pull requests it covers (`MILESTONE_CHECK_NAME`): passing when the
pull request has a milestone or the `no milestone` label, which the gate adds once the contribution
rules are met. It has to publish it itself, because a label added with `GITHUB_TOKEN` does not start new
workflow runs, so PR Cop would never see the label and its check would stay red. The two use the same
rule, and the newer check of a name is the one that counts. Both come from the GitHub Actions app,
which is the source branch protection expects.

The gate also waits for these checks, which are named in `config.js` and must keep matching `pr.yml`:
`lint`, `unit-test`, `e2e-ci (shard N/4)` and `visual-a11y-ci (shard N/2)`. The two visual shards have
their own names so that a failing shard cannot hide behind a passing one.

## Before the pilot

1. Create the `new-workflow-candidate` label.
2. Create the team named in `REVIEWER_TEAM_SLUG`, and check the token can request it. The gate reads
   the request back and, if the team is not on the pull request afterwards, posts a comment mentioning
   the team instead, so a person is told either way.
3. Optionally create the `gate:needs-compliance`, `gate:awaiting-ci`, `gate:automated-review` and
   `gate:team-review` labels, with colours that read as a progression. GitHub creates any the gate asks
   for that do not exist, but in a default grey.

## Switching over

Once the pilot has earned it:

1. Set `PILOT_LABEL` to `undefined` in `config.js`, and remove the job-level `if:` that mentions it in
   `contribution-gate.yml`. The daily sweep then starts on the open backlog, up to
   `MAXIMUM_INTAKE_PER_SWEEP` a day, and everything it finds incomplete gets a reminder before
   anything is closed. Expect a lot of old bug reports among them.
2. Remove PR Cop (`prcop.yml` and `prcop-config.json`). The gate publishes `Check Milestone` itself.
3. Move the issue templates to Issue Forms with a required Testing Instructions field, update the pull
   request template to describe what happens next, and disable blank issues.
4. Set "Fork pull request workflows from outside collaborators" to require approval only for
   contributors new to GitHub, so CI runs without a maintainer clicking anything.
5. Check the token can resolve a review thread through the GraphQL `resolveReviewThread` mutation.
