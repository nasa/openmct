/**
 * Every change the gate makes to a contribution.
 *
 * All writes live here so that dry-run mode has one place to stop, and so that
 * the rest of the gate stays free of API calls.
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

class GateActions {
  constructor({ github, core, owner, repo, dryRun }) {
    this.github = github;
    this.core = core;
    this.owner = owner;
    this.repo = repo;
    this.dryRun = dryRun;
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
    if (this.skip(`add label "${label}" to #${contributionNumber}`)) {
      return;
    }

    await this.github.rest.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: contributionNumber,
      labels: [label]
    });
  }

  async removeLabel(contributionNumber, label) {
    if (this.skip(`remove label "${label}" from #${contributionNumber}`)) {
      return;
    }

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

    if (this.skip(`update sticky comment on #${contributionNumber}`)) {
      return;
    }

    await this.github.rest.issues.updateComment({
      owner: this.owner,
      repo: this.repo,
      comment_id: existingComment.id,
      body
    });
  }

  async postComment(contributionNumber, body) {
    if (this.skip(`comment on #${contributionNumber}`)) {
      return;
    }

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
    if (this.skip(`request an AI review on #${pullNumber}`)) {
      return true;
    }

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
    if (this.skip(`request review from @${this.owner}/${REVIEWER_TEAM_SLUG} on #${pullNumber}`)) {
      return true;
    }

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
   * stacking a new one on top of it, so a required check reads one way only.
   */
  async publishCheck({ headSha, name, isPassing, title, summary }) {
    if (this.skip(`publish the "${name}" check as ${isPassing ? 'passing' : 'failing'} on ${headSha.slice(0, 7)}`)) {
      return;
    }

    const conclusion = isPassing ? 'success' : 'failure';
    const existingCheck = await this.findOwnCheck(headSha, name);

    if (existingCheck !== undefined && existingCheck.conclusion === conclusion) {
      this.core.info(`The "${name}" check is already ${conclusion}.`);

      return;
    }

    const result = { conclusion, output: { title, summary } };

    if (existingCheck === undefined) {
      await this.github.rest.checks.create({
        owner: this.owner,
        repo: this.repo,
        head_sha: headSha,
        name,
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
    if (this.skip(`resolve review thread ${threadId}`)) {
      return;
    }

    await this.github.graphql(RESOLVE_THREAD_MUTATION, { threadId });
  }

  async closeContribution(contributionNumber, body) {
    await this.postComment(contributionNumber, body);

    if (this.skip(`close #${contributionNumber}`)) {
      return;
    }

    await this.github.rest.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: contributionNumber,
      state: 'closed',
      state_reason: 'not_planned'
    });
  }

  async reopenContribution(contributionNumber) {
    if (this.skip(`reopen #${contributionNumber}`)) {
      return;
    }

    await this.github.rest.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: contributionNumber,
      state: 'open'
    });
  }

  /**
   * @returns {boolean} true when the action was only logged, because the gate is
   * running in dry-run mode
   */
  skip(description) {
    if (this.dryRun === false) {
      this.core.info(`Gate: ${description}`);

      return false;
    }

    this.core.info(`Gate (dry run, no change made): would ${description}`);

    return true;
  }

  async findOwnCheck(headSha, name) {
    const checks = await this.github.paginate(this.github.rest.checks.listForRef, {
      owner: this.owner,
      repo: this.repo,
      ref: headSha,
      check_name: name,
      per_page: 100
    });

    return checks.find((check) => check.name === name && check.app?.slug === 'github-actions');
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
