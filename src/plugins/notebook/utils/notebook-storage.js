const NOTEBOOK_LOCAL_STORAGE = 'notebook-storage';

export function getDefaultNotebook() {
    const notebookStorage = window.localStorage.getItem(NOTEBOOK_LOCAL_STORAGE);

    return JSON.parse(notebookStorage);
}

export function setDefaultNotebook(notebook, section, page) {
    const notebookMeta = {
        name: notebook.domainObject.name,
        identifier: notebook.domainObject.identifier
    };

    const notebookStorage = {
        notebookMeta,
        section,
        page
    }

    window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, JSON.stringify(notebookStorage));
}

export function clearDefaultNotebook(notebook, section, page) {
    window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, null);
}
