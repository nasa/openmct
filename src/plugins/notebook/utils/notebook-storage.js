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

function observeDefaultNotebookObject(openmct, notebookMeta, domainObject) {
    if (currentNotebookObjectIdentifier
            && currentNotebookObjectIdentifier.key === notebookMeta.identifier.key) {
        return;
    }

    if (unlisten) {
        unlisten();
        unlisten = null;
    }

    unlisten = openmct.objects.observe(domainObject, '*', defaultNotebookObjectChanged);
}

function saveDefaultNotebook(notebookStorage) {
    window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, JSON.stringify(notebookStorage));
}

export function clearDefaultNotebook() {
    currentNotebookObjectIdentifier = null;
    window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, null);
}

export function getDefaultNotebook() {
    const notebookStorage = window.localStorage.getItem(NOTEBOOK_LOCAL_STORAGE);

    return JSON.parse(notebookStorage);
}

export function setDefaultNotebook(openmct, notebookStorage, domainObject) {
    observeDefaultNotebookObject(openmct, notebookStorage.notebookMeta, domainObject);
    saveDefaultNotebook(notebookStorage);
}

export function setDefaultNotebookSection(section) {
    const notebookStorage = getDefaultNotebook();

    notebookStorage.section = section;
    saveDefaultNotebook(notebookStorage);
}

export function setDefaultNotebookPage(page) {
    const notebookStorage = getDefaultNotebook();
    notebookStorage.page = page;
    saveDefaultNotebook(notebookStorage);
}

export function validateNotebookStorageObject() {
    const notebookStorage = getDefaultNotebook();

    let valid = false;
    if (notebookStorage) {
        Object.entries(notebookStorage).forEach(([key, value]) => {
            const validKey = key !== undefined && key !== null;
            const validValue = value !== undefined && value !== null;
            valid = validKey && validValue;
        });
    }

    if (valid) {
        return notebookStorage;
    }

    console.warn('Invalid Notebook object, clearing default notebook storage');

    clearDefaultNotebook();
}
