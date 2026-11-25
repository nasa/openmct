/**
 * The checklist the gate shows a contributor: every check a contribution goes
 * through, each with whether it has passed, so the whole process is laid out
 * from the start and the contributor can see where they are in it.
 *
 * An item that is a contribution rule also carries the failure it represents.
 * Those failures are what start the deadline, and what the reminder and closing
 * comments repeat.
 */

const STATUSES = {
  done: 'done',
  toDo: 'toDo',
  inProgress: 'inProgress'
};

/**
 * @param {string} label what the check requires
 * @returns {{label: string, status: string}}
 */
function createDoneItem(label) {
  return { label, status: STATUSES.done };
}

/**
 * @param {string} label what the check requires
 * @param {string} fix what the contributor can do about it
 */
function createToDoItem(label, fix) {
  return { label, status: STATUSES.toDo, fix };
}

/** A check someone or something else is working on, with nothing for the contributor to do. */
function createInProgressItem(label) {
  return { label, status: STATUSES.inProgress };
}

/**
 * A contribution rule that is not met yet.
 *
 * @param {string} label what the rule requires
 * @param {{id: string, summary: string, fix: string}} failure
 */
function createFailedRuleItem(label, failure) {
  return { ...createToDoItem(label, failure.fix), failure };
}

/** @returns {{id: string, summary: string, fix: string}[]} the rules the items fail */
function listFailures(items) {
  return items.filter((item) => item.failure !== undefined).map((item) => item.failure);
}

function isDone(item) {
  return item.status === STATUSES.done;
}

function isToDo(item) {
  return item.status === STATUSES.toDo;
}

module.exports = {
  STATUSES,
  createDoneItem,
  createFailedRuleItem,
  createInProgressItem,
  createToDoItem,
  isDone,
  isToDo,
  listFailures
};
