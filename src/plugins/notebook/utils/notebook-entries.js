export const addNotebookEntry = (domainObject, selectedSection, selectedPage) => {
    console.log('addNotebookEntry');
}

export const getNotebookDefaultEntries = (notebookStorage, domainObject) => {
    if (!notebookStorage || !domainObject) {
        return null;
    }

    const defaultSection = notebookStorage.section;
    const defaultPage = notebookStorage.page;
    if (!defaultSection || !defaultPage) {
        return null;
    }

    const configuration = domainObject.configuration;
    const entries = configuration.entries || {};

    let section = entries[defaultSection.id];
    if (!section) {
        section = {};
        entries[defaultSection.id] = section;
    }

    let page = entries[defaultSection.id][defaultPage.id];
    if (!page) {
        page = [];
        entries[defaultSection.id][defaultPage.id] = [];
    }

    return entries[defaultSection.id][defaultPage.id];
}

export const getNotebookEntries = (domainObject, selectedSection, selectedPage) => {
    if (!domainObject || !selectedSection || !selectedPage) {
        return null;
    }

    const configuration = domainObject.configuration;
    const entries = configuration.entries || {};

    let section = entries[selectedSection.id];
    if (!section) {
        return null;
    }

    let page = entries[selectedSection.id][selectedPage.id];
    if (!page) {
        return null;
    }

    return entries[selectedSection.id][selectedPage.id];
}

