/**
 * Tests for which changes are held for a maintainer. Run with:
 *
 *   npm run test:fork-ci-approval
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { findOwnedPaths, readOwnedPatterns } = require('./codeowners');
const { DECISIONS, decideApproval } = require('./approvalDecision');

const REPOSITORY_ROOT = path.resolve(__dirname, '../../..');
const REAL_PATTERNS = readOwnedPatterns(fs.readFileSync(path.join(REPOSITORY_ROOT, '.github/CODEOWNERS'), 'utf8'));

test('the real CODEOWNERS holds back every kind of file that runs code', () => {
  const sensitive = [
    '.github/workflows/pr.yml',
    '.github/scripts/contribution-gate/evaluate.js',
    '.github/CODEOWNERS',
    'package.json',
    'package-lock.json',
    '.npmrc',
    'e2e/package.json',
    '.webpack/webpack.common.mjs',
    'karma.conf.cjs',
    'e2e/playwright-ci.config.js',
    'src/plugins/persistence/couch/setup-couchdb.sh'
  ];

  assert.deepEqual(findOwnedPaths(sensitive, REAL_PATTERNS), sensitive);
});

test('the real CODEOWNERS lets ordinary source, tests and docs through', () => {
  const ordinary = [
    'src/plugins/notificationIndicator/components/NotificationIndicator.vue',
    'src/api/notifications/NotificationAPISpec.js',
    'e2e/tests/functional/notification.e2e.spec.js',
    'src/plugins/plot/package.json.md',
    'docs/src/process/release.md',
    'README.md'
  ];

  assert.deepEqual(findOwnedPaths(ordinary, REAL_PATTERNS), []);
});

test('an anchored pattern only matches from the repository root', () => {
  assert.deepEqual(findOwnedPaths(['package.json', 'src/plugins/foo/package.json'], ['/package.json']), ['package.json']);
});

test('an unanchored pattern matches at any depth', () => {
  assert.deepEqual(findOwnedPaths(['package.json', 'src/plugins/foo/package.json'], ['package.json']), [
    'package.json',
    'src/plugins/foo/package.json'
  ]);
});

test('a directory pattern covers everything beneath it, and nothing that merely shares its name', () => {
  assert.deepEqual(findOwnedPaths(['.github/a/b.yml', '.github', '.github-old/x'], ['/.github/']), ['.github/a/b.yml']);
});

test('comments and blank lines are not patterns', () => {
  assert.deepEqual(readOwnedPatterns('# owners\n\n/.github/ @team\n  # indented comment\n/package.json @a @b\n'), [
    '/.github/',
    '/package.json'
  ]);
});

test('a pull request changing only ordinary files is approved', () => {
  const verdict = decideApproval({ changedPaths: ['src/a.js', 'src/aSpec.js'], isFileListComplete: true }, REAL_PATTERNS);

  assert.equal(verdict.decision, DECISIONS.approve);
});

test('a pull request changing a sensitive file is held, and says which', () => {
  const verdict = decideApproval(
    { changedPaths: ['src/a.js', '.github/workflows/pr.yml', 'package.json'], isFileListComplete: true },
    REAL_PATTERNS
  );

  assert.equal(verdict.decision, DECISIONS.hold);
  assert.deepEqual(verdict.ownedPaths, ['.github/workflows/pr.yml', 'package.json']);
});

test('moving a workflow out of .github/ is held, because the old path counts', () => {
  const verdict = decideApproval(
    { changedPaths: ['docs/old-workflow.yml', '.github/workflows/pr.yml'], isFileListComplete: true },
    REAL_PATTERNS
  );

  assert.equal(verdict.decision, DECISIONS.hold);
});

test('a pull request too large to list completely is held', () => {
  const verdict = decideApproval({ changedPaths: ['src/a.js'], isFileListComplete: false }, REAL_PATTERNS);

  assert.equal(verdict.decision, DECISIONS.hold);
  assert.match(verdict.reason, /not every change could be checked/);
});

test('with no CODEOWNERS patterns, nothing is approved', () => {
  const verdict = decideApproval({ changedPaths: ['src/a.js'], isFileListComplete: true }, []);

  assert.equal(verdict.decision, DECISIONS.hold);
});
