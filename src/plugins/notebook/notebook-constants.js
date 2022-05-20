export const NOTEBOOK_TYPE = 'notebook';
export const RESTRICTED_NOTEBOOK_TYPE = 'restricted-notebook';
export const EVENT_SNAPSHOTS_UPDATED = 'SNAPSHOTS_UPDATED';
export const NOTEBOOK_DEFAULT = 'DEFAULT';
export const NOTEBOOK_SNAPSHOT = 'SNAPSHOT';
export const NOTEBOOK_VIEW_TYPE = 'notebook-vue';
export const RESTRICTED_NOTEBOOK_VIEW_TYPE = 'restricted-notebook-vue';
export const NOTEBOOK_INSTALLED_KEY = '_NOTEBOOK_PLUGIN_INSTALLED';
export const RESTRICTED_NOTEBOOK_INSTALLED_KEY = '_RESTRICTED_NOTEBOOK_PLUGIN_INSTALLED';

// these only deals with constants, figured this could skip going into a utils file
export function isNotebookType(domainObject) {
    return [NOTEBOOK_TYPE, RESTRICTED_NOTEBOOK_TYPE].includes(domainObject.type);
}

export function isNotebookViewType(view) {
    return [NOTEBOOK_VIEW_TYPE, RESTRICTED_NOTEBOOK_VIEW_TYPE].includes(view);
}
