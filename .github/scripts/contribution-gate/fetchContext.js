/**
 * Reads everything the gate needs about a contribution.
 *
 * Only metadata is read. Nothing here checks out or runs contributed code,
 * which is what makes it safe for the gate to hold a write token on a pull
 * request opened from a fork.
 */

const { AI_REVIEWER_LOGINS, CHECKS_REQUIRED_WHEN_REPORTED, REQUIRED_CHECK_NAMES } = require('./config');
const { MARKER_PREFIX } = require('./stateMarker');

const MAXIMUM_LINKED_ISSUES = 10;
const MAXIMUM_ISSUE_COMMENTS = 100;
const MAXIMUM_REVIEW_THREADS = 100;
const MAXIMUM_THREAD_COMMENTS = 50;
const MAXIMUM_REVIEWS = 100;
const THREAD_SUMMARY_LENGTH = 120;

const PULL_REQUEST_QUERY = `
  query pullRequestGateContext($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        number
        body
        isDraft
        state
        authorAssociation
        headRefOid
        author { login }
        milestone { number }
        labels(first: 50) { nodes { name } }
        closingIssuesReferences(first: ${MAXIMUM_LINKED_ISSUES}) {
          nodes {
            number
            body
            labels(first: 20) { nodes { name } }
            comments(first: ${MAXIMUM_ISSUE_COMMENTS}) { nodes { body author { login } } }
          }
        }
        reviews(first: ${MAXIMUM_REVIEWS}) { nodes { author { login } } }
        reviewThreads(first: ${MAXIMUM_REVIEW_THREADS}) {
          nodes {
            id
            isResolved
            path
            line
            comments(first: ${MAXIMUM_THREAD_COMMENTS}) {
              nodes { body url author { login } }
            }
          }
        }
      }
    }
  }
`;

const ISSUE_REFERENCES_QUERY = `
  query issueReferences($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
        timelineItems(last: 50, itemTypes: [CROSS_REFERENCED_EVENT, CONNECTED_EVENT]) {
          nodes {
            __typename
            ... on CrossReferencedEvent {
              source { __typename ... on PullRequest { number state } }
            }
            ... on ConnectedEvent {
              subject { __typename ... on PullRequest { number state } }
            }
          }
        }
      }
    }
  }
`;

async function fetchPullRequestContext(reader, pullNumber) {
  const response = await reader.github.graphql(PULL_REQUEST_QUERY, {
    owner: reader.owner,
    repo: reader.repo,
    number: pullNumber
  });
  const pullRequest = response.repository.pullRequest;

  return {
    isPullRequest: true,
    number: pullRequest.number,
    body: pullRequest.body ?? '',
    isDraft: pullRequest.isDraft,
    state: pullRequest.state,
    headSha: pullRequest.headRefOid,
    authorLogin: readAuthorLogin(pullRequest),
    authorAssociation: pullRequest.authorAssociation,
    hasMilestone: pullRequest.milestone !== null,
    labels: readNames(pullRequest.labels),
    changedFiles: await fetchChangedFiles(reader, pullNumber),
    linkedIssues: pullRequest.closingIssuesReferences.nodes.map(toLinkedIssue),
    reviewThreads: pullRequest.reviewThreads.nodes.map(toReviewThread),
    hasAiReview: pullRequest.reviews.nodes.some(isAiReviewer),
    checkConclusions: await fetchCheckConclusions(reader, pullRequest.headRefOid)
  };
}

async function fetchIssueContext(reader, issueNumber) {
  const { data: issue } = await reader.github.rest.issues.get({
    owner: reader.owner,
    repo: reader.repo,
    issue_number: issueNumber
  });

  return {
    isPullRequest: issue.pull_request !== undefined,
    number: issue.number,
    body: issue.body ?? '',
    state: issue.state.toUpperCase(),
    authorLogin: issue.user.login,
    authorAssociation: issue.author_association,
    labels: issue.labels.map((label) => label.name),
    comments: await fetchIssueComments(reader, issueNumber)
  };
}

/** Every open issue and pull request, for the daily sweep. */
async function fetchOpenContributions(reader) {
  const items = await reader.github.paginate(reader.github.rest.issues.listForRepo, {
    owner: reader.owner,
    repo: reader.repo,
    state: 'open',
    per_page: 100
  });

  return items.map(toContributionSummary);
}

/** Open pull requests carrying one of the given labels, for the frequent poll. */
async function fetchContributionsWithLabels(reader, labels) {
  const perLabel = await Promise.all(labels.map((label) => fetchContributionsWithLabel(reader, label)));

  return deduplicateByNumber(perLabel.flat());
}

async function fetchContributionsWithLabel(reader, label) {
  const items = await reader.github.paginate(reader.github.rest.issues.listForRepo, {
    owner: reader.owner,
    repo: reader.repo,
    state: 'open',
    labels: label,
    per_page: 100
  });

  return items.map(toContributionSummary);
}

/**
 * The open pull requests for a branch. A completed workflow run tells us the
 * branch it ran on, but not the pull request number when the branch lives on a
 * fork.
 */
async function fetchPullRequestsForHead(reader, head) {
  const { data: pullRequests } = await reader.github.rest.pulls.list({
    owner: reader.owner,
    repo: reader.repo,
    state: 'open',
    head: `${head.owner}:${head.branch}`,
    per_page: 100
  });

  return pullRequests.map((pullRequest) => ({ number: pullRequest.number, isPullRequest: true }));
}

/** The single comment the gate keeps on a contribution, if it has posted one. */
async function fetchStickyComment(reader, contributionNumber) {
  const comments = await reader.github.paginate(reader.github.rest.issues.listComments, {
    owner: reader.owner,
    repo: reader.repo,
    issue_number: contributionNumber,
    per_page: 100
  });

  return comments.find((comment) => comment.body.includes(MARKER_PREFIX));
}

/**
 * Open pull requests that reference an issue, so that editing an issue or adding
 * testing instructions to it re-evaluates the work that depends on it.
 */
async function fetchPullRequestsReferencingIssue(reader, issueNumber) {
  const response = await reader.github.graphql(ISSUE_REFERENCES_QUERY, {
    owner: reader.owner,
    repo: reader.repo,
    number: issueNumber
  });
  const timelineItems = response.repository.issue.timelineItems.nodes;
  const referencedPullRequests = timelineItems.map(readReferencedPullRequest).filter(isOpenPullRequest);

  return deduplicateByNumber(referencedPullRequests);
}

async function fetchChangedFiles(reader, pullNumber) {
  const files = await reader.github.paginate(reader.github.rest.pulls.listFiles, {
    owner: reader.owner,
    repo: reader.repo,
    pull_number: pullNumber,
    per_page: 100
  });

  return files.map((file) => file.filename);
}

async function fetchIssueComments(reader, issueNumber) {
  const comments = await reader.github.paginate(reader.github.rest.issues.listComments, {
    owner: reader.owner,
    repo: reader.repo,
    issue_number: issueNumber,
    per_page: 100
  });

  return comments.map((comment) => ({ body: comment.body ?? '' }));
}

/**
 * @returns {Map<string, string>} the latest conclusion for each check run we
 * care about; a check that has not reported yet is absent
 */
async function fetchCheckConclusions(reader, headSha) {
  const checkRuns = await reader.github.paginate(reader.github.rest.checks.listForRef, {
    owner: reader.owner,
    repo: reader.repo,
    ref: headSha,
    per_page: 100
  });
  const checksWeCareAbout = [...REQUIRED_CHECK_NAMES, ...CHECKS_REQUIRED_WHEN_REPORTED];
  const conclusions = new Map();

  checkRuns
    .filter((checkRun) => checksWeCareAbout.includes(checkRun.name))
    .forEach((checkRun) => conclusions.set(checkRun.name, checkRun.conclusion));

  return conclusions;
}

function toLinkedIssue(issue) {
  return {
    number: issue.number,
    body: issue.body ?? '',
    labels: readNames(issue.labels),
    comments: issue.comments.nodes.map((comment) => ({ body: comment.body ?? '' }))
  };
}

function toReviewThread(thread) {
  const firstComment = thread.comments.nodes[0];

  return {
    id: thread.id,
    isResolved: thread.isResolved,
    path: thread.path,
    line: thread.line,
    url: firstComment === undefined ? '' : firstComment.url,
    summary: summarize(firstComment),
    comments: thread.comments.nodes
  };
}

function toContributionSummary(item) {
  return {
    number: item.number,
    isPullRequest: item.pull_request !== undefined,
    isDraft: item.draft === true,
    labels: item.labels.map((label) => label.name)
  };
}

function summarize(comment) {
  if (comment === undefined) {
    return '';
  }

  const firstLine = comment.body.trim().split('\n')[0];

  if (firstLine.length <= THREAD_SUMMARY_LENGTH) {
    return firstLine;
  }

  return `${firstLine.slice(0, THREAD_SUMMARY_LENGTH)}…`;
}

/**
 * Only Copilot counts here. CodeQL also submits reviews, and treating one of
 * those as the AI review would send a pull request on to a human before the
 * review we paid for had arrived.
 */
function isAiReviewer(review) {
  if (review.author === null) {
    return false;
  }

  return AI_REVIEWER_LOGINS.includes(review.author.login.toLowerCase());
}

function readAuthorLogin(pullRequest) {
  if (pullRequest.author === null) {
    return '';
  }

  return pullRequest.author.login;
}

function readNames(labelConnection) {
  return labelConnection.nodes.map((label) => label.name);
}

function readReferencedPullRequest(timelineItem) {
  const referenced = timelineItem.source ?? timelineItem.subject;

  if (referenced === undefined || referenced === null) {
    return undefined;
  }

  if (referenced.__typename !== 'PullRequest') {
    return undefined;
  }

  return { number: referenced.number, state: referenced.state, isPullRequest: true };
}

function isOpenPullRequest(referenced) {
  if (referenced === undefined) {
    return false;
  }

  return referenced.state === 'OPEN';
}

function deduplicateByNumber(contributions) {
  const byNumber = new Map(contributions.map((contribution) => [contribution.number, contribution]));

  return [...byNumber.values()];
}

module.exports = {
  fetchContributionsWithLabels,
  fetchIssueContext,
  fetchOpenContributions,
  fetchPullRequestContext,
  fetchPullRequestsForHead,
  fetchPullRequestsReferencingIssue,
  fetchStickyComment
};
