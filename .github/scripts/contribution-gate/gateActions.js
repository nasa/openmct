/**
 * Every change the gate makes to a contribution.
 *
 * All writes live here, each one logged, so that the rest of the gate stays free
 * of API calls and a run's log reads as a list of what it changed.
 */

const {
  AI_REVIEWER_LOGINS,
  COPILOT_REVIEWER_LOGIN,
  REVIEWER_TEAM_SLUG,
  STAGE_LABELS
} = require('./config');

const RESOLVE_THREAD_MUTATION = `
  mutation resolveGateThread($threadId: ID!) {
    resolveReviewThread(input: { threadId: $threadId }) {
      thread { id }
    }
  }
`;

const ALL_STAGE_LABELS = Object.values(STAGE_LABELS);

/**
 * Marks the checks the gate creates. A workflow job's check run comes from the
 * same GitHub Actions app and can share a name, as PR Cop's "Check Milestone"
 * does, so the app alone cannot tell them apart. The gate must only ever update
 * its own checks, never another workflow's job.
 */
const GATE_CHECK_EXTERNAL_ID = 'openmct-contribution-gate';

class GateActions {
  constructor({ github, core, owner, repo }) {
    this.github = github;
    this.core = core;
    this.owner = owner;
    this.repo = repo;
  }

  /** Leaves exactly one stage label on the contribution. */
  async setStage(contributionNumber, stageLabel, currentLabels) {
    const staleLabels = ALL_STAGE_LABELS.filter(
      (label) => label !== stageLabel && currentLabels.includes(label)
    );

    if (currentLabels.includes(stageLabel) === false) {
      await this.addLabel(contributionNumber, stageLabel);
    }

    for (const label of staleLabels) {
      await this.removeLabel(contributionNumber, label);
    }
  }

  async addLabel(contributionNumber, label) {
    this.log(`add label "${label}" to #${contributionNumber}`);

    await this.github.rest.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: contributionNumber,
      labels: [label]
    });
  }

  async removeLabel(contributionNumber, label) {
    this.log(`remove label "${label}" from #${contributionNumber}`);

    await this.ignoreMissing(
      this.github.rest.issues.removeLabel({
        owner: this.owner,
        repo: this.repo,
        issue_number: contributionNumber,
        name: label
      })
    );
  }

  /** Posts the gate's comment, or edits the one already there. */
  async upsertStickyComment(contributionNumber, body, existingComment) {
    if (existingComment === undefined) {
      await this.postComment(contributionNumber, body);

      return;
    }

    if (existingComment.body === body) {
      this.core.info(`Sticky comment on #${contributionNumber} is already up to date.`);

      return;
    }

    this.log(`update sticky comment on #${contributionNumber}`);

    await this.github.rest.issues.updateComment({
      owner: this.owner,
      repo: this.repo,
      comment_id: existingComment.id,
      body
    });
  }

  async postComment(contributionNumber, body) {
    this.log(`comment on #${contributionNumber}`);

    await this.github.rest.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: contributionNumber,
      body
    });
  }

  /**
   * Asks Copilot for a code review. This is the step that costs money.
   *
   * @returns {Promise<boolean>} true only when Copilot really is on the review
   * list afterwards. The API answers success to a request it silently drops, for
   * instance when the account has no Copilot entitlement, so the outcome is read
   * back rather than trusted.
   */
  async requestAiReview(pullNumber) {
    this.log(`request an AI review on #${pullNumber}`);

    const wasSent = await this.tryRequest(() =>
      this.github.rest.pulls.requestReviewers({
        owner: this.owner,
        repo: this.repo,
        pull_number: pullNumber,
        reviewers: [COPILOT_REVIEWER_LOGIN]
      })
    );

    if (wasSent === false) {
      return false;
    }

    return this.confirmReviewer(pullNumber, 'the AI reviewer', (requested) =>
      requested.users.some((user) => AI_REVIEWER_LOGINS.includes(user.login.toLowerCase()))
    );
  }

  /**
   * The one moment the gate asks for human attention.
   *
   * @returns {Promise<boolean>} true only when the team really is on the review
   * list afterwards; see requestAiReview for why the answer is read back.
   */
  async requestTeamReview(pullNumber) {
    this.log(`request review from @${this.owner}/${REVIEWER_TEAM_SLUG} on #${pullNumber}`);

    const wasSent = await this.tryRequest(() =>
      this.github.rest.pulls.requestReviewers({
        owner: this.owner,
        repo: this.repo,
        pull_number: pullNumber,
        team_reviewers: [REVIEWER_TEAM_SLUG]
      })
    );

    if (wasSent === false) {
      return false;
    }

    return this.confirmReviewer(pullNumber, `the team "${REVIEWER_TEAM_SLUG}"`, (requested) =>
      requested.teams.some((team) => team.slug === REVIEWER_TEAM_SLUG)
    );
  }

  /**
   * Publishes a check on a commit, updating the gate's earlier one rather than
   * stacking another on top of it. Another workflow's check of the same name is
   * left alone: the gate's sits beside it, and being newer, is the one branch
   * protection reads.
   */
  async publishCheck({ headSha, name, isPassing, title, summary }) {
    const conclusion = isPassing ? 'success' : 'failure';
    const existingCheck = await this.findOwnCheck(headSha, name);

    if (existingCheck !== undefined && existingCheck.conclusion === conclusion) {
      this.core.info(`The "${name}" check is already ${conclusion} on ${headSha.slice(0, 7)}.`);

      return;
    }

    this.log(`publish the "${name}" check as ${isPassing ? 'passing' : 'failing'} on ${headSha.slice(0, 7)}`);

    const result = { conclusion, output: { title, summary } };

    if (existingCheck === undefined) {
      await this.github.rest.checks.create({
        owner: this.owner,
        repo: this.repo,
        head_sha: headSha,
        name,
        external_id: GATE_CHECK_EXTERNAL_ID,
        status: 'completed',
        ...result
      });

      return;
    }

    await this.github.rest.checks.update({
      owner: this.owner,
      repo: this.repo,
      check_run_id: existingCheck.id,
      ...result
    });
  }

  /** Resolves a thread the author has already replied to, so they need not. */
  async resolveReviewThread(threadId) {
    this.log(`resolve review thread ${threadId}`);

    await this.github.graphql(RESOLVE_THREAD_MUTATION, { threadId });
  }

  async closeContribution(contributionNumber, body) {
    await this.postComment(contributionNumber, body);

    this.log(`close #${contributionNumber}`);

    await this.github.rest.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: contributionNumber,
      state: 'closed',
      state_reason: 'not_planned'
    });
  }

  async reopenContribution(contributionNumber) {
    this.log(`reopen #${contributionNumber}`);

    await this.github.rest.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: contributionNumber,
      state: 'open'
    });
  }

  log(description) {
    this.core.info(`Gate: ${description}`);
  }

  async findOwnCheck(headSha, name) {
    const checks = await this.github.paginate(this.github.rest.checks.listForRef, {
      owner: this.owner,
      repo: this.repo,
      ref: headSha,
      check_name: name,
      per_page: 100
    });

    return checks.find((check) => check.name === name && check.external_id === GATE_CHECK_EXTERNAL_ID);
  }

  async tryRequest(request) {
    try {
      await request();

      return true;
    } catch (error) {
      this.core.warning(`Gate: the review request was refused (${error.status ?? ''} ${error.message}).`);

      return false;
    }
  }

  async confirmReviewer(pullNumber, description, isOnList) {
    const { data: requested } = await this.github.rest.pulls.listRequestedReviewers({
      owner: this.owner,
      repo: this.repo,
      pull_number: pullNumber
    });
    const isConfirmed = isOnList(requested);

    if (isConfirmed === false) {
      this.core.warning(
        `Gate: the API accepted the request, but ${description} is not on #${pullNumber}'s review list afterwards, so it was silently dropped.`
      );
    }

    return isConfirmed;
  }

  async ignoreMissing(request) {
    try {
      await request;
    } catch (error) {
      this.core.debug(`Gate: nothing to do (${error.message})`);
    }
  }
}

module.exports = { GateActions };
