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
| `prCompliance.js`, `issueCompliance.js` | The rules, as pure functions returning a checklist item for each, met or not. |
| `checklist.js`, `pullRequestChecklist.js` | The checklist the comment shows: every check in the process, each marked done, not yet, or in progress. |
| `aiCheckResults.js` | Reads each of CodeRabbit's pre-merge check results from its summary comment. |
| `markdownSections.js` | Reading issue and pull request sections. |
| `reviewThreads.js`, `reviewerLogins.js`, `checkStatus.js` | Which automated-reviewer comments are answered, who the automated reviewers are, and whether CI has passed. |
| `deadlines.js` | The clock: when a contribution runs out of time, and who is exempt. |
| `feedbackComment.js`, `stateMarker.js` | The single sticky comment, and the state hidden inside it. |

State lives in that sticky comment, in an HTML comment marker, so the gate needs no database. The
`gate:*` labels show the current stage.

The comment is a checklist of every check a contribution goes through: the linked issue, which gets
the same checklist of its own sections and testing instructions on the issue itself; the Author
Checklist, with any unticked items named; CodeRabbit's pre-merge checks, as one line; each required
CI job, with its shards as one line; replies to CodeRabbit and CodeQL; CodeRabbit's approval; the
labels the gate sets; the team review request; and a maintainer's approval. Every check is assessed
on every run, wherever the pull request has got to, so a contributor sees green CI even while a rule
is still outstanding. The stage is still decided as before; the checklist only reports.

Two reviewers comment without a person asking. The gate requests neither, but a contributor must
reply to every comment from either before the team is asked to look:

- __CodeRabbit__ (`coderabbitai[bot]`) reviews every pull request into `master`, configured by
  [.coderabbit.yaml](../../../.coderabbit.yaml). Its pre-merge checks are the rules that need
  judgement: that the linked issue explains why the change is needed, that a test covers it, and that
  a bug fix adds no features. Their results appear only in CodeRabbit's comment, and its
  "CodeRabbit" status check succeeds whatever they say. The gate reads CodeRabbit's **review**, and
  also the results table in that comment, accepting it only from the `coderabbitai[bot]` account, so
  it can show the checks passed before CodeRabbit approves. That format is undocumented, so the
  review wins where they disagree. With `auto_approvals` on, CodeRabbit requests changes when a
  check in `error` mode fails, which the gate treats as a broken rule, deadline and all; and approves
  once they pass and its threads are resolved, which is the last thing the gate waits for before
  asking the team. A failing `warning` check does not stop it approving, so any check that must hold
  a pull request back has to be in `error` mode. `AI_REQUIRED_CHECK_NAMES` in `config.js` must list exactly the `error`-mode checks,
  which a test enforces.
- __CodeQL__ (`github-advanced-security[bot]`) posts its own security findings, and its `Analyze` check
  must pass whenever it runs. CodeQL skips pull requests that only touch specs, documentation or
  configuration, so it is in `CHECKS_REQUIRED_WHEN_REPORTED` rather than `REQUIRED_CHECK_NAMES`: a
  check that never reports would otherwise leave those pull requests waiting forever.

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
npm run test:workflow-scripts
```

These cover the rules, the clock, the marker and the trigger routing. They make no network calls.

## The pilot

The gate acts only on contributions carrying `PILOT_LABEL` (`new-workflow-candidate`). Outside
contributors cannot add labels, so only a maintainer can opt something in. Adding the label starts the
gate on it straight away; removing it stops the gate, but leaves its labels and comment where they are.

While it is in the pilot:

- **PR Cop keeps running** on every pull request, candidates included, checking the description
  against the template. None of its checks is required.
- **The current issue templates stay.** The gate reads them as they are: the enhancement template's
  own headings count. Testing instructions can be added to the issue as a comment.
- **Neither a `type:` label nor a milestone is required.** The pull request template no longer asks
  for them. Pull requests opened from the older template still carry those two checklist items, so
  the gate never asks for them to be ticked (`RETIRED_CHECKLIST_ITEMS`).
- **Nothing outside the pilot is closed.** The daily sweep looks only at labelled contributions, so
  there is no backlog to work through.

To look at one contribution on demand, run the workflow manually with its number. Every action the
gate takes is logged as a line starting `Gate:`.

To try the process on an issue as well as a pull request, label the issue.

## Branch protection

Branch protection on `master` requires **two approvals**: CodeRabbit's and a maintainer's. GitHub
counts CodeRabbit's approval like a person's, which was tested on a branch with a one-approval rule.
Every pull request needs CodeRabbit's, not only those in the pilot. When one of its checks is wrong, a
maintainer who has been requested as a reviewer can tell it to ignore the failure with
`@coderabbitai ignore pre-merge checks` (`override_requested_reviewers_only` stops the author doing
so). Whether CodeRabbit then approves has not been tested; two maintainers' approvals merge a pull
request either way.

The gate also waits for these checks, which are named in `config.js` and must keep matching `pr.yml`:
`lint`, `unit-test`, `e2e-ci (shard N/4)` and `visual-a11y-ci (shard N/2)`. The two visual shards have
their own names so that a failing shard cannot hide behind a passing one.

## Before the pilot

1. Create the `new-workflow-candidate` label, and require two approvals on `master`, just before this
   merges: with one, CodeRabbit's approval alone would let a pull request merge. At the same time,
   remove `Check Milestone` from `master`'s required status checks: nothing produces it any more, so
   every pull request would wait for it forever.
2. Check the token can request the team named in `REVIEWER_TEAM_SLUG` (`openmct-web`). The gate reads
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
2. Remove PR Cop (`prcop.yml` and `prcop-config.json`).
3. Move the issue templates to Issue Forms with a required Testing Instructions field, update the pull
   request template to describe what happens next, and disable blank issues.
4. Set "Fork pull request workflows from outside collaborators" to require approval only for
   contributors new to GitHub, so CI runs without a maintainer clicking anything.
5. Check the token can resolve a review thread through the GraphQL `resolveReviewThread` mutation.
