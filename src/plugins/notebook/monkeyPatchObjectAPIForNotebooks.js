import _ from 'lodash';
import { toRaw } from 'vue';

import { isAnnotationType, isNotebookOrAnnotationType, isNotebookType } from './notebook-constants';

export default function (openmct) {
  const apiSave = openmct.objects.save.bind(openmct.objects);

  openmct.objects.save = async (domainObject) => {
    if (!isNotebookOrAnnotationType(domainObject)) {
      return apiSave(domainObject);
    }

    const isNewMutable = !domainObject.isMutable;
    const localMutable = openmct.objects.toMutable(domainObject);
    let result;

    try {
      result = await apiSave(localMutable);
    } catch (error) {
      if (error instanceof openmct.objects.errors.Conflict) {
        result = await resolveConflicts(domainObject, localMutable, openmct);
      } else {
        result = Promise.reject(error);
      }
    } finally {
      if (isNewMutable) {
        openmct.objects.destroyMutable(localMutable);
      }
    }

    return result;
  };
}

function resolveConflicts(domainObject, localMutable, openmct) {
  if (isNotebookType(domainObject)) {
    return resolveNotebookEntryConflicts(localMutable, openmct);
  } else if (isAnnotationType(domainObject)) {
    return resolveNotebookTagConflicts(localMutable, openmct);
  }
}

async function resolveNotebookTagConflicts(localAnnotation, openmct) {
  const localClonedAnnotation = structuredClone(toRaw(localAnnotation));
  const remoteMutable = await openmct.objects.getMutable(localClonedAnnotation.identifier);

  // should only be one annotation per targetID, entryID, and tag; so for sanity, ensure we have the
  // same targetID, entryID, and tags for this conflict
  if (!_.isEqual(remoteMutable.tags, localClonedAnnotation.tags)) {
    throw new Error("Conflict on annotation's tag has different tags than remote");
  }

  Object.keys(localClonedAnnotation.targets).forEach((targetKey) => {
    if (!remoteMutable.targets[targetKey]) {
      throw new Error(`Conflict on annotation's target is missing ${targetKey}`);
    }

    const remoteMutableTarget = remoteMutable.targets[targetKey];
    const localMutableTarget = localClonedAnnotation.targets[targetKey];

    if (remoteMutableTarget.entryId !== localMutableTarget.entryId) {
      throw new Error(
        `Conflict on annotation's entryID ${remoteMutableTarget.entryId} has a different entry Id ${localMutableTarget.entryId}`
      );
    }
  });

  if (remoteMutable._deleted && remoteMutable._deleted !== localClonedAnnotation._deleted) {
    // not deleting wins 😘
    openmct.objects.mutate(remoteMutable, '_deleted', false);
  }

  openmct.objects.destroyMutable(remoteMutable);

  return true;
}

async function resolveNotebookEntryConflicts(localMutable, openmct) {
  if (localMutable.configuration.entries) {
    const FORCE_REMOTE = true;
    const localEntries = structuredClone(toRaw(localMutable.configuration.entries));
    const remoteObject = await openmct.objects.get(
      localMutable.identifier,
      undefined,
      FORCE_REMOTE
    );

    return applyLocalEntries(remoteObject, localEntries, openmct);
  }

  return true;
}

function applyLocalEntries(remoteObject, entries, openmct) {
  let shouldSave = false;

  Object.entries(entries).forEach(([sectionKey, pagesInSection]) => {
    Object.entries(pagesInSection).forEach(([pageKey, localEntries]) => {
      const remoteEntries = remoteObject.configuration.entries[sectionKey][pageKey];
      const mergedEntries = [].concat(remoteEntries);
      let shouldMutate = false;

      const locallyAddedEntries = _.differenceBy(localEntries, remoteEntries, 'id');
      const locallyModifiedEntries = _.differenceWith(
        localEntries,
        remoteEntries,
        (localEntry, remoteEntry) => {
          return localEntry.id === remoteEntry.id && localEntry.text === remoteEntry.text;
        }
      );

      locallyAddedEntries.forEach((localEntry) => {
        mergedEntries.push(localEntry);
        shouldMutate = true;
      });

      locallyModifiedEntries.forEach((locallyModifiedEntry) => {
        let mergedEntry = mergedEntries.find((entry) => entry.id === locallyModifiedEntry.id);
        if (mergedEntry !== undefined && locallyModifiedEntry.text.match(/\S/)) {
          mergedEntry.text = locallyModifiedEntry.text;
          shouldMutate = true;
        }
      });

      if (shouldMutate) {
        shouldSave = true;
        openmct.objects.mutate(
          remoteObject,
          `configuration.entries.${sectionKey}.${pageKey}`,
          mergedEntries
        );
      }
    });
  });

  if (shouldSave) {
    return openmct.objects.save(remoteObject);
  }
}
