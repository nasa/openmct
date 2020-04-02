const NOTEBOOK_LOCAL_STORAGE = 'notebook-storage';

export function clearDefaultNotebook() {
    window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, null);
}

export function getDefaultNotebook() {
    const notebookStorage = window.localStorage.getItem(NOTEBOOK_LOCAL_STORAGE);

    return JSON.parse(notebookStorage);
}

export function setDefaultNotebook(notebookStorage) {
    window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, JSON.stringify(notebookStorage));
}

export function setDefaultNotebookSection(section) {
    const notebookStorage = getDefaultNotebook();

    notebookStorage.section = section;
    window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, JSON.stringify(notebookStorage));

}

export function setDefaultNotebookPage(page) {
    const notebookStorage = getDefaultNotebook();
    notebookStorage.page = page;
    window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, JSON.stringify(notebookStorage));
}
