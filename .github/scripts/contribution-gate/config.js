/**
 * Policy for the contribution gate.
 *
 * Everything here is a decision about how we want the process to behave, kept
 * apart from the logic that enforces it. Changing the process should mean
 * changing this file and nothing else.
 */

/** Records which stage of the contribution process a pull request has reached. */
const STAGE_LABELS = {
  needsCompliance: 'gate:needs-compliance',
  awaitingCi: 'gate:awaiting-ci',
  aiReview: 'gate:ai-review',
  teamReview: 'gate:team-review'
};

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
  'visual-a11y-ci'
];

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

/** The reviewer we ask for on a pull request. */
const COPILOT_REVIEWER_LOGIN = 'copilot-pull-request-reviewer[bot]';

/** Copilot has posted under several logins; treat all of them as the AI reviewer. */
const COPILOT_AUTHOR_LOGINS = [
  'copilot-pull-request-reviewer[bot]',
  'copilot-pull-request-reviewer',
  'github-copilot[bot]',
  'copilot[bot]',
  'copilot'
];

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

/** Sections an issue must fill in, chosen by the issue's `type:` label. */
const REQUIRED_ISSUE_SECTIONS = {
  'type:bug': ['Summary', 'Expected vs Current Behavior', 'Steps to Reproduce', 'Testing Instructions'],
  'type:enhancement': ['Summary', "Describe the solution you'd like"],
  'type:maintenance': ['Summary'],
  untyped: ['Summary']
};

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
  COPILOT_AUTHOR_LOGINS,
  COPILOT_REVIEWER_LOGIN,
  DEADLINE_DAYS,
  GATE_EXEMPT_LABEL,
  MAXIMUM_INTAKE_PER_SWEEP,
  NO_MILESTONE_LABEL,
  RECHECK_COMMAND,
  REMINDER_LEAD_DAYS,
  REQUIRED_CHECK_NAMES,
  REQUIRED_ISSUE_SECTIONS,
  REVIEWER_TEAM_SLUG,
  STAGE_LABELS,
  TEAM_ALLOWLIST,
  TEAM_AUTHOR_ASSOCIATIONS,
  TEST_EXEMPT_FILE_PATTERNS,
  TEST_FILE_PATTERNS,
  TESTING_INSTRUCTION_HEADINGS,
  TYPE_LABEL_PREFIX
};
