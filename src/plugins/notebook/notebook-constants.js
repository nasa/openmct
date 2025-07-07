export const NOTEBOOK_TYPE = 'notebook';
export const RESTRICTED_NOTEBOOK_TYPE = 'restricted-notebook';
export const ANNOTATION_TYPE = 'annotation';
export const EVENT_SNAPSHOTS_UPDATED = 'SNAPSHOTS_UPDATED';
export const NOTEBOOK_DEFAULT = 'DEFAULT';
export const NOTEBOOK_SNAPSHOT = 'SNAPSHOT';
export const NOTEBOOK_VIEW_TYPE = 'notebook-vue';
export const RESTRICTED_NOTEBOOK_VIEW_TYPE = 'restricted-notebook-vue';
export const NOTEBOOK_BASE_INSTALLED = '_NOTEBOOK_BASE_FUNCTIONALITY_INSTALLED';

// these only deals with constants, figured this could skip going into a utils file
export function isNotebookOrAnnotationType(domainObject) {
  return isNotebookType(domainObject) || isAnnotationType(domainObject);
}

export function isNotebookType(domainObject) {
  return [NOTEBOOK_TYPE, RESTRICTED_NOTEBOOK_TYPE].includes(domainObject.type);
}

export function isAnnotationType(domainObject) {
  return [ANNOTATION_TYPE].includes(domainObject.type);
}

export function isNotebookViewType(view) {
  return [NOTEBOOK_VIEW_TYPE, RESTRICTED_NOTEBOOK_VIEW_TYPE].includes(view);
}
