import objectLink from '../../../ui/mixins/object-link';
import { v4 as uuid } from 'uuid';

async function getUsername(openmct) {
  let username = null;

  if (openmct.user.hasProvider()) {
    const user = await openmct.user.getCurrentUser();
    username = user.getName();
  }

  return username;
}

async function getActiveRole(openmct) {
  let role = null;
  if (openmct.user.hasProvider()) {
    role = await openmct.user.getActiveRole?.();
  }

  return role;
}

export const DEFAULT_CLASS = 'notebook-default';
const TIME_BOUNDS = {
  START_BOUND: 'tc.startBound',
  END_BOUND: 'tc.endBound',
  START_DELTA: 'tc.startDelta',
  END_DELTA: 'tc.endDelta'
};

export function addEntryIntoPage(notebookStorage, entries, entry) {
  const defaultSectionId = notebookStorage.defaultSectionId;
  const defaultPageId = notebookStorage.defaultPageId;
  if (!defaultSectionId || !defaultPageId) {
    return;
  }

  const newEntries = JSON.parse(JSON.stringify(entries));
  let section = newEntries[defaultSectionId];
  if (!section) {
    newEntries[defaultSectionId] = {};
  }

  let page = newEntries[defaultSectionId][defaultPageId];
  if (!page) {
    newEntries[defaultSectionId][defaultPageId] = [];
  }

  newEntries[defaultSectionId][defaultPageId].push(entry);

  return newEntries;
}

export function selectEntry({
  element,
  entryId,
  domainObject,
  openmct,
  onAnnotationChange,
  notebookAnnotations
}) {
  const targetDetails = {};
  const keyString = openmct.objects.makeKeyString(domainObject.identifier);
  targetDetails[keyString] = {
    entryId
  };
  const targetDomainObjects = {};
  targetDomainObjects[keyString] = domainObject;
  openmct.selection.select(
    [
      {
        element,
        context: {
          type: 'notebook-entry-selection',
          item: domainObject,
          targetDetails,
          targetDomainObjects,
          annotations: notebookAnnotations,
          annotationType: openmct.annotation.ANNOTATION_TYPES.NOTEBOOK,
          onAnnotationChange
        }
      }
    ],
    false
  );
}

export function getHistoricLinkInFixedMode(openmct, bounds, historicLink) {
  if (historicLink.includes('tc.mode=fixed')) {
    return historicLink;
  }

  openmct.time.getAllClocks().forEach((clock) => {
    if (historicLink.includes(`tc.mode=${clock.key}`)) {
      historicLink.replace(`tc.mode=${clock.key}`, 'tc.mode=fixed');

      return;
    }
  });

  const params = historicLink.split('&').map((param) => {
    if (param.includes(TIME_BOUNDS.START_BOUND) || param.includes(TIME_BOUNDS.START_DELTA)) {
      param = `${TIME_BOUNDS.START_BOUND}=${bounds.start}`;
    }

    if (param.includes(TIME_BOUNDS.END_BOUND) || param.includes(TIME_BOUNDS.END_DELTA)) {
      param = `${TIME_BOUNDS.END_BOUND}=${bounds.end}`;
    }

    return param;
  });

  return params.join('&');
}

export async function createNewEmbed(snapshotMeta, snapshot = '') {
  const { bounds, link, objectPath, openmct } = snapshotMeta;
  const domainObject = objectPath[0];
  const domainObjectType = openmct.types.get(domainObject.type);

  const cssClass =
    domainObjectType && domainObjectType.definition
      ? domainObjectType.definition.cssClass
      : 'icon-object-unknown';
  const date = openmct.time.now();
  const historicLink = link
    ? getHistoricLinkInFixedMode(openmct, bounds, link)
    : objectLink.computed.objectLink.call({
        objectPath,
        openmct
      });
  const name = domainObject.name;
  const type = domainObject.identifier.key;
  const createdBy = await getUsername(openmct);

  return {
    bounds,
    createdOn: date,
    createdBy,
    cssClass,
    domainObject,
    historicLink,
    id: 'embed-' + date,
    name,
    snapshot,
    type
  };
}

export async function addNotebookEntry(
  openmct,
  domainObject,
  notebookStorage,
  embed = null,
  entryText = ''
) {
  if (!openmct || !domainObject || !notebookStorage) {
    return;
  }

  const date = openmct.time.now();
  const configuration = domainObject.configuration;
  const entries = configuration.entries || {};
  const embeds = embed ? [embed] : [];

  const id = `entry-${uuid()}`;
  const [createdBy, createdByRole] = await Promise.all([
    getUsername(openmct),
    getActiveRole(openmct)
  ]);
  const entry = {
    id,
    createdOn: date,
    createdBy,
    createdByRole,
    text: entryText,
    embeds
  };

  const newEntries = addEntryIntoPage(notebookStorage, entries, entry);

  addDefaultClass(domainObject, openmct);
  mutateObject(openmct, domainObject, 'configuration.entries', newEntries);

  return id;
}

export function getNotebookEntries(domainObject, selectedSection, selectedPage) {
  if (!domainObject || !selectedSection || !selectedPage || !domainObject.configuration) {
    return;
  }

  const configuration = domainObject.configuration;
  const entries = configuration.entries || {};

  let section = entries[selectedSection.id];
  if (!section) {
    return;
  }

  let page = entries[selectedSection.id][selectedPage.id];
  if (!page) {
    return;
  }

  const specificEntries = entries[selectedSection.id][selectedPage.id];

  return specificEntries;
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

function addDefaultClass(domainObject, openmct) {
  openmct.status.set(domainObject.identifier, DEFAULT_CLASS);
}
