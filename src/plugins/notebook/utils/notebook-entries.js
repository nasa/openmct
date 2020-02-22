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

export const addNotebookEntry = (openmct, domainObject, notebookStorage, embedObject = null, imageUrl = null) => {
    const date = Date.now();
    const configuration = domainObject.configuration;
    const entries = configuration.entries || {};

    if (!entries) {
        return;
    }

    const embeds = embedObject
        ? [{
            name: embedObject.name,
            cssClass: embedObject.cssClass,
            type: embedObject.id,
            id: 'embed-' + date,
            createdOn: date,
            snapshot: imageUrl ? { src: imageUrl } : ''
        }]
        : [];

    const pages = getNotebookDefaultEntries(notebookStorage, domainObject);
    pages.push({
        id: 'entry-' + date,
        createdOn: date,
        text: date,
        embeds
    });

    openmct.objects.mutate(domainObject, 'configuration.entries', entries);
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
