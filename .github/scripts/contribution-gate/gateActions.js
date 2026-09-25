/**
 * Every change the gate makes to a contribution.
 *
 * All writes live here so that dry-run mode has one place to stop, and so that
 * the rest of the gate stays free of API calls.
 */

const { COPILOT_REVIEWER_LOGIN, REVIEWER_TEAM_SLUG, STAGE_LABELS } = require('./config');

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

  /** Asks Copilot for a code review. This is the step that costs money. */
  async requestAiReview(pullNumber) {
    if (this.skip(`request an AI review on #${pullNumber}`)) {
      return;
    }

    await this.github.rest.pulls.requestReviewers({
      owner: this.owner,
      repo: this.repo,
      pull_number: pullNumber,
      reviewers: [COPILOT_REVIEWER_LOGIN]
    });
  }

  /** The one moment the gate asks for human attention. */
  async requestTeamReview(pullNumber) {
    if (this.skip(`request review from @${this.owner}/${REVIEWER_TEAM_SLUG} on #${pullNumber}`)) {
      return;
    }

    await this.github.rest.pulls.requestReviewers({
      owner: this.owner,
      repo: this.repo,
      pull_number: pullNumber,
      team_reviewers: [REVIEWER_TEAM_SLUG]
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

  async ignoreMissing(request) {
    try {
      await request;
    } catch (error) {
      this.core.debug(`Gate: nothing to do (${error.message})`);
    }
  }
}

module.exports = { GateActions };
