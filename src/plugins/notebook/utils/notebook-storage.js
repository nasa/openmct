import objectUtils from 'objectUtils';

const NOTEBOOK_LOCAL_STORAGE = 'notebook-storage';
let currentNotebookObjectIdentifier = null;
let unlisten = null;

function defaultNotebookObjectChanged(newDomainObject) {
  if (newDomainObject.location !== null) {
    currentNotebookObjectIdentifier = newDomainObject.identifier;

    return;
  }

  if (unlisten) {
    unlisten();
    unlisten = null;
  }

  clearDefaultNotebook();
}

function observeDefaultNotebookObject(openmct, notebookStorage, domainObject) {
  if (
    currentNotebookObjectIdentifier &&
    objectUtils.makeKeyString(currentNotebookObjectIdentifier) ===
      objectUtils.makeKeyString(notebookStorage.identifier)
  ) {
    return;
  }

  removeListener();

  unlisten = openmct.objects.observe(domainObject, '*', defaultNotebookObjectChanged);
}

function removeListener() {
  if (unlisten) {
    unlisten();
    unlisten = null;
  }
}

function saveDefaultNotebook(notebookStorage) {
  window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, JSON.stringify(notebookStorage));
}

export function clearDefaultNotebook() {
  currentNotebookObjectIdentifier = null;
  removeListener();

  window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, null);
}

export function getDefaultNotebook() {
  const notebookStorage = window.localStorage.getItem(NOTEBOOK_LOCAL_STORAGE);

  return JSON.parse(notebookStorage);
}

export function getNotebookSectionAndPage(domainObject, sectionId, pageId) {
  const configuration = domainObject.configuration;
  const section = configuration && configuration.sections.find((s) => s.id === sectionId);
  const page = section && section.pages.find((p) => p.id === pageId);

  return {
    section,
    page
  };
}

export async function getDefaultNotebookLink(openmct, domainObject = null) {
  if (!domainObject) {
    return null;
  }

  const path = await openmct.objects
    .getOriginalPath(domainObject.identifier)
    .then(openmct.objects.getRelativePath);
  const { defaultPageId, defaultSectionId } = getDefaultNotebook();

  return `#/browse/${path}?sectionId=${defaultSectionId}&pageId=${defaultPageId}`;
}

export function setDefaultNotebook(openmct, notebookStorage, domainObject) {
  observeDefaultNotebookObject(openmct, notebookStorage, domainObject);
  saveDefaultNotebook(notebookStorage);
}

export function setDefaultNotebookSectionId(sectionId) {
  const notebookStorage = getDefaultNotebook();
  notebookStorage.defaultSectionId = sectionId;
  saveDefaultNotebook(notebookStorage);
}

export function setDefaultNotebookPageId(pageId) {
  const notebookStorage = getDefaultNotebook();
  notebookStorage.defaultPageId = pageId;
  saveDefaultNotebook(notebookStorage);
}

export function validateNotebookStorageObject() {
  const notebookStorage = getDefaultNotebook();
  if (!notebookStorage) {
    return true;
  }

  let valid = false;
  if (notebookStorage) {
    const oldInvalidKeys = ['notebookMeta', 'page', 'section'];
    valid = Object.entries(notebookStorage).every(([key, value]) => {
      const validKey = key !== undefined && key !== null;
      const validValue = value !== undefined && value !== null;
      const hasOldInvalidKeys = oldInvalidKeys.includes(key);

      return validKey && validValue && !hasOldInvalidKeys;
    });
  }

  if (valid) {
    return notebookStorage;
  }

  console.warn('Invalid Notebook object, clearing default notebook storage');

  clearDefaultNotebook();
}
