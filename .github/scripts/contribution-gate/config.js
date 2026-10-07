/**
 * Policy for the contribution gate.
 *
 * Everything here is a decision about how we want the process to behave, kept
 * apart from the logic that enforces it. Changing the process should mean
 * changing this file and nothing else.
 */

/**
 * While the gate is being piloted alongside PR Cop, it acts only on issues and
 * pull requests a maintainer has given this label, and ignores everything else.
 * Outside contributors cannot add labels, so nobody is opted in by accident.
 *
 * Set this to undefined to switch over, so that the gate covers every
 * contribution. See "Switching over" in the README first.
 */
const PILOT_LABEL = 'new-workflow-candidate';

/** Records which stage of the contribution process a pull request has reached. */
const STAGE_LABELS = {
  needsCompliance: 'gate:needs-compliance',
  awaitingCi: 'gate:awaiting-ci',
  automatedReview: 'gate:automated-review',
  teamReview: 'gate:team-review'
};

/**
 * The check that branch protection requires before a pull request can merge.
 * The gate publishes it itself, because the label it relies on is added with a
 * token whose events do not start new workflow runs.
 */
const MILESTONE_CHECK_NAME = 'Check Milestone';

/** A maintainer applies this to pay for a second Copilot review. */
const AI_REVIEW_AGAIN_LABEL = 'gate:ai-review-again';

/** Dependabot and maintainers use this to opt a pull request out of the gate. */
const GATE_EXEMPT_LABEL = 'pr:daveit';

/** Stands in for a milestone, which outside contributors cannot set. */
const NO_MILESTONE_LABEL = 'no milestone';

/** How long a non-compliant contribution has before it is closed. */
const DEADLINE_DAYS = {
  readyPullRequest: 7,
  draftPullRequest: 30,
  issue: 7
};

/** A single reminder goes out this many days before the deadline. */
const REMINDER_LEAD_DAYS = 2;

/** Every one of these must succeed before the gate pays for an AI review. */
const REQUIRED_CHECK_NAMES = [
  'lint',
  'unit-test',
  'e2e-ci (shard 1/4)',
  'e2e-ci (shard 2/4)',
  'e2e-ci (shard 3/4)',
  'e2e-ci (shard 4/4)',
  'visual-a11y-ci (shard 1/2)',
  'visual-a11y-ci (shard 2/2)'
];

/**
 * Checks that must pass if they run at all, but whose absence is not held
 * against a contribution. CodeQL skips pull requests that only touch specs,
 * documentation and configuration, so requiring it outright would leave those
 * waiting for a check that is never coming.
 */
const CHECKS_REQUIRED_WHEN_REPORTED = ['Analyze'];

/** A pull request satisfies the automated-test rule by touching one of these. */
const TEST_FILE_PATTERNS = ['**/*Spec.js', '**/*.e2e.spec.js', 'e2e/**/*.spec.js'];

/** Changes that cannot reasonably carry an automated test. */
const TEST_EXEMPT_FILE_PATTERNS = [
  '**/*.md',
  '.github/**',
  'docs/**',
  '*.json',
  '.vscode/**',
  '.claude/**',
  'LICENSES/**'
];

/**
 * The identity we REQUEST as a reviewer. It is not the identity the review is
 * posted under (see AI_REVIEWER_LOGINS). The API accepts the wrong one and
 * silently drops the request, so every request is read back.
 */
const COPILOT_REVIEWER_LOGIN = 'Copilot';

/**
 * Copilot has posted under several logins. Only these count as the AI review we
 * paid for and are waiting on.
 */
const AI_REVIEWER_LOGINS = [
  'copilot-pull-request-reviewer[bot]',
  'copilot-pull-request-reviewer',
  'github-copilot[bot]',
  'copilot[bot]',
  'copilot'
];

/** CodeQL reviews on its own, and is never requested by the gate. */
const SECURITY_REVIEWER_LOGINS = ['github-advanced-security[bot]'];

/**
 * Every reviewer whose comments a contributor must answer before a maintainer is
 * asked to read the pull request. A security finding nobody has explained should
 * never reach a human as a surprise.
 */
const AUTOMATED_REVIEWER_LOGINS = [...AI_REVIEWER_LOGINS, ...SECURITY_REVIEWER_LOGINS];

/** The team asked to review once a pull request reaches stage 6. */
const REVIEWER_TEAM_SLUG = 'openmct-maintainers';

/**
 * Logins treated as team members even though `author_association` does not say
 * so, which happens when someone's organization membership is private.
 */
const TEAM_ALLOWLIST = [];

/** Author associations GitHub reports for people on the team. */
const TEAM_AUTHOR_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR'];

/** Comment command that asks the gate to look again, including at closed items. */
const RECHECK_COMMAND = '/recheck';

/** Marks which kind of change a contribution is; copied from issue to pull request. */
const TYPE_LABEL_PREFIX = 'type:';

/**
 * How many contributions the daily sweep introduces to the gate in one run.
 * This keeps a large backlog from exhausting the API rate limit, at the cost of
 * taking a few days to work through it.
 */
const MAXIMUM_INTAKE_PER_SWEEP = 60;

/**
 * Sections an issue must fill in, chosen by the issue's `type:` label. Where an
 * entry is a list, any one of those headings will do, because issues were filed
 * under templates that have worded the same section differently over the years.
 *
 * Testing instructions are not required here. A pull request needs them on its
 * issue, and checks for them itself, accepting them in a comment as well, since
 * whoever fixes an issue often cannot edit it.
 */
const REQUIRED_ISSUE_SECTIONS = {
  'type:bug': ['Summary', 'Expected vs Current Behavior', 'Steps to Reproduce'],
  'type:enhancement': [
    ['Summary', 'Is your feature request related to a problem? Please describe.'],
    "Describe the solution you'd like"
  ],
  'type:maintenance': ['Summary'],
  untyped: ['Summary']
};

/**
 * Author-checklist items about things the gate does itself, so it never asks a
 * contributor to tick them: it copies the type label from the issue, and records
 * the milestone decision. Outside contributors could not do either.
 */
const CHECKLIST_ITEMS_HANDLED_BY_THE_GATE = [/\bmilestone\b/i, /`?type:`?\s*label/i];

/**
 * Headings that count as testing instructions, in an issue body or in a comment
 * on the issue. Several spellings are accepted because issues filed under the
 * older Markdown templates used their own wording.
 */
const TESTING_INSTRUCTION_HEADINGS = [
  'Testing Instructions',
  'Verification Instructions',
  'Testing',
  'Steps to Test',
  'How to Test'
];

module.exports = {
  AI_REVIEW_AGAIN_LABEL,
  AI_REVIEWER_LOGINS,
  AUTOMATED_REVIEWER_LOGINS,
  CHECKS_REQUIRED_WHEN_REPORTED,
  COPILOT_REVIEWER_LOGIN,
  DEADLINE_DAYS,
  GATE_EXEMPT_LABEL,
  CHECKLIST_ITEMS_HANDLED_BY_THE_GATE,
  MAXIMUM_INTAKE_PER_SWEEP,
  MILESTONE_CHECK_NAME,
  NO_MILESTONE_LABEL,
  PILOT_LABEL,
  RECHECK_COMMAND,
  REMINDER_LEAD_DAYS,
  REQUIRED_CHECK_NAMES,
  REQUIRED_ISSUE_SECTIONS,
  REVIEWER_TEAM_SLUG,
  SECURITY_REVIEWER_LOGINS,
  STAGE_LABELS,
  TEAM_ALLOWLIST,
  TEAM_AUTHOR_ASSOCIATIONS,
  TEST_EXEMPT_FILE_PATTERNS,
  TEST_FILE_PATTERNS,
  TESTING_INSTRUCTION_HEADINGS,
  TYPE_LABEL_PREFIX
};
