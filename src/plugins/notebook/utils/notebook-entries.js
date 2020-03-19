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

export const createNewEmbed = (bounds, name, cssClass, type, snapshot = '', domainObject, objectPath) => {
    const date = Date.now();
    const embed = {
        bounds,
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

export const addNotebookEntry = (openmct, domainObject, notebookStorage, embed = null) => {
    if (!openmct || !domainObject || !notebookStorage) {
        return;
    }

    const date = Date.now();
    const configuration = domainObject.configuration;
    const entries = configuration.entries || {};

    if (!entries) {
        return;
    }

    const embeds = embed
        ? [embed]
        : [];

    const defaultEntries = getNotebookDefaultEntries(notebookStorage, domainObject);
    const id = `entry-${date}`;
    defaultEntries.push({
        id,
        createdOn: date,
        text: '',
        embeds
    });

    openmct.objects.mutate(domainObject, 'configuration.entries', entries);

    return id;
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

export const getEntryPosById = (entryId, domainObject, selectedSection, selectedPage) => {
    if (!domainObject || !selectedSection || !selectedPage) {
        return;
    }

    const entries = getNotebookEntries(domainObject, selectedSection, selectedPage);
    let foundId = -1;
    entries.forEach((element, index) => {
        if (element.id === entryId) {
            foundId = index;

            return;
        }
    });

    return foundId;
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
