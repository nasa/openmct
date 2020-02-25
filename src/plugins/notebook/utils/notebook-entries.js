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

export const createNewEmbed = (name, cssClass, type, snapshot = '', domainObject, objectPath) => {
    const date = Date.now();
    const embed = {
        name,
        cssClass,
        type,
        id: 'embed-' + date,
        createdOn: date,
        snapshot
    }

    if (domainObject) {
        embed.domainObject = domainObject;
    }

    if (objectPath) {
        embed.objectPath = objectPath;
    }

    return embed;
}

export const addNotebookEntry = (openmct, domainObject, notebookStorage, embedObject = null, imageUrl = null) => {
    if (!openmct || !domainObject || !notebookStorage) {
        return;
    }

    const date = Date.now();
    const configuration = domainObject.configuration;
    const entries = configuration.entries || {};

    if (!entries) {
        return;
    }

    const embeds = embedObject
        ? [createNewEmbed(embedObject.name, embedObject.cssClass, embedObject.id, imageUrl ? { src: imageUrl } : '')]
        :[];

    const defaultEntries = getNotebookDefaultEntries(notebookStorage, domainObject);
    defaultEntries.push({
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

export const deleteNotebookEntries = (openmct, domainObject, selectedSection, selectedPage) => {
    if (!domainObject || !selectedSection) {
        return;
    }

    const configuration = domainObject.configuration;
    const entries = configuration.entries || {};

    // Delete entire section
    if (!selectedPage) {
        delete entries[selectedSection.id];

        return;
    }

    let section = entries[selectedSection.id];
    if (!section) {
        return;
    }

    delete entries[selectedSection.id][selectedPage.id];
    openmct.objects.mutate(domainObject, 'configuration.entries', entries);
}
