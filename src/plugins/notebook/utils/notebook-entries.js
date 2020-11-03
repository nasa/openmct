import objectLink from '../../../ui/mixins/object-link';
export const DEFAULT_CLASS = 'is-notebook-default';
const TIME_BOUNDS = {
    START_BOUND: 'tc.startBound',
    END_BOUND: 'tc.endBound',
    START_DELTA: 'tc.startDelta',
    END_DELTA: 'tc.endDelta'
};

export function addEntryIntoPage(notebookStorage, entries, entry) {
    if (!notebookStorage) {
        return null;
    }

    const defaultSection = notebookStorage.section;
    const defaultPage = notebookStorage.page;
    if (!defaultSection || !defaultPage) {
        return null;
    }

    const newEntries = JSON.parse(JSON.stringify(entries));
    let section = newEntries[defaultSection.id];
    if (!section) {
        newEntries[defaultSection.id] = {};
    }

    let page = newEntries[defaultSection.id][defaultPage.id];
    if (!page) {
        newEntries[defaultSection.id][defaultPage.id] = [];
    }

    newEntries[defaultSection.id][defaultPage.id].push(entry);

    return newEntries;
}

export function getHistoricLinkInFixedMode(openmct, bounds, historicLink) {
    if (historicLink.includes('tc.mode=fixed')) {
        return historicLink;
    }

    openmct.time.getAllClocks().forEach(clock => {
        if (historicLink.includes(`tc.mode=${clock.key}`)) {
            historicLink.replace(`tc.mode=${clock.key}`, 'tc.mode=fixed');

            return;
        }
    });

    const params = historicLink.split('&').map(param => {
        if (param.includes(TIME_BOUNDS.START_BOUND)
                || param.includes(TIME_BOUNDS.START_DELTA)) {
            param = `${TIME_BOUNDS.START_BOUND}=${bounds.start}`;
        }

        if (param.includes(TIME_BOUNDS.END_BOUND)
                || param.includes(TIME_BOUNDS.END_DELTA)) {
            param = `${TIME_BOUNDS.END_BOUND}=${bounds.end}`;
        }

        return param;
    });

    return params.join('&');
}

export function createNewEmbed(snapshotMeta, snapshot = '') {
    const {
        bounds,
        link,
        objectPath,
        openmct
    } = snapshotMeta;
    const domainObject = objectPath[0];
    const domainObjectType = openmct.types.get(domainObject.type);

    const cssClass = domainObjectType && domainObjectType.definition
        ? domainObjectType.definition.cssClass
        : 'icon-object-unknown';
    const date = Date.now();
    const historicLink = link
        ? getHistoricLinkInFixedMode(openmct, bounds, link)
        : objectLink.computed.objectLink.call({
            objectPath,
            openmct
        });
    const name = domainObject.name;
    const type = domainObject.identifier.key;

    return {
        bounds,
        createdOn: date,
        cssClass,
        domainObject,
        historicLink,
        id: 'embed-' + date,
        name,
        snapshot,
        type
    };
}

export function addNotebookEntry(openmct, domainObject, notebookStorage, embed = null) {
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

    const id = `entry-${date}`;
    const entry = {
        id,
        createdOn: date,
        text: '',
        embeds
    };

    const newEntries = addEntryIntoPage(notebookStorage, entries, entry);

    addDefaultClass(domainObject);
    mutateObject(openmct, domainObject, 'configuration.entries', newEntries);

    return id;
}

export function getNotebookEntries(domainObject, selectedSection, selectedPage) {
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

export function getEntryPosById(entryId, domainObject, selectedSection, selectedPage) {
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

export function deleteNotebookEntries(openmct, domainObject, selectedSection, selectedPage) {
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

    mutateObject(openmct, domainObject, 'configuration.entries', entries);
}

export function mutateObject(openmct, object, key, value) {
    openmct.objects.mutate(object, key, value);
}

function addDefaultClass(domainObject) {
    const classList = domainObject.classList || [];
    if (classList.includes(DEFAULT_CLASS)) {
        return;
    }

    classList.push(DEFAULT_CLASS);
}
