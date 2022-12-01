import { isAnnotationType, isNotebookType, isNotebookOrAnnotationType } from './notebook-constants';
import _ from 'lodash';

export default function (openmct) {
    const apiSave = openmct.objects.save.bind(openmct.objects);

    openmct.objects.save = async (domainObject) => {
        console.log('notebook monkeypatch');
        if (!isNotebookOrAnnotationType(domainObject)) {
            console.log('not a notebook, skipping');
            return apiSave(domainObject);
        }
        console.log('is a notebook');
        const isNewMutable = !domainObject.isMutable;
        const localMutable = openmct.objects.toMutable(domainObject);
        console.log('fozen local object entries', JSON.parse(JSON.stringify(domainObject.configuration.entries)));
        let result;

        try {
            result = await apiSave(localMutable);
        } catch (error) {
            if (error instanceof openmct.objects.errors.Conflict) {
                console.log('tryin to save, but error', error);
                result = await resolveConflicts(domainObject, localMutable, openmct);
            } else {
                console.log('is not conflict type');
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
        console.log('conflict error is for notebook type');
        return resolveNotebookEntryConflicts(localMutable, openmct);
    } else if (isAnnotationType(domainObject)) {
        return resolveNotebookTagConflicts(localMutable, openmct);
    }
}

async function resolveNotebookTagConflicts(localAnnotation, openmct) {
    const localClonedAnnotation = structuredClone(localAnnotation);
    const remoteMutable = await openmct.objects.getMutable(localClonedAnnotation.identifier);

    // should only be one annotation per targetID, entryID, and tag; so for sanity, ensure we have the
    // same targetID, entryID, and tags for this conflict
    if (!(_.isEqual(remoteMutable.tags, localClonedAnnotation.tags))) {
        throw new Error('Conflict on annotation\'s tag has different tags than remote');
    }

    Object.keys(localClonedAnnotation.targets).forEach(targetKey => {
        if (!remoteMutable.targets[targetKey]) {
            throw new Error(`Conflict on annotation's target is missing ${targetKey}`);
        }

        const remoteMutableTarget = remoteMutable.targets[targetKey];
        const localMutableTarget = localClonedAnnotation.targets[targetKey];

        if (remoteMutableTarget.entryId !== localMutableTarget.entryId) {
            throw new Error(`Conflict on annotation's entryID ${remoteMutableTarget.entryId} has a different entry Id ${localMutableTarget.entryId}`);
        }
    });

    if (remoteMutable._deleted && (remoteMutable._deleted !== localClonedAnnotation._deleted)) {
        // not deleting wins 😘
        openmct.objects.mutate(remoteMutable, '_deleted', false);
    }

    openmct.objects.destroyMutable(remoteMutable);

    return true;
}

async function resolveNotebookEntryConflicts(localMutable, openmct) {
    console.log('resolveNotebookEntryConflicts');
    if (localMutable.configuration.entries) {
        console.log('therer are entries to resolve');
        const localEntries = structuredClone(localMutable.configuration.entries);
        const remoteMutable = await openmct.objects.getMutable(localMutable.identifier);
        console.log('remoteMutable frozen entries', JSON.parse(JSON.stringify(remoteMutable.configuration.entries)));
        applyLocalEntries(remoteMutable, localEntries, openmct);
        openmct.objects.destroyMutable(remoteMutable);
    }

    return true;
}

function applyLocalEntries(mutable, entries, openmct) {
    console.log('apply local entries', entries);
    Object.entries(entries).forEach(([sectionKey, pagesInSection]) => {
        Object.entries(pagesInSection).forEach(([pageKey, localEntries]) => {
            const remoteEntries = mutable.configuration.entries[sectionKey][pageKey];
            const mergedEntries = [].concat(remoteEntries);
            let shouldMutate = false;

            const locallyAddedEntries = _.differenceBy(localEntries, remoteEntries, 'id');
            const locallyModifiedEntries = _.differenceWith(localEntries, remoteEntries, (localEntry, remoteEntry) => {
                return localEntry.id === remoteEntry.id && localEntry.text === remoteEntry.text;
            });

            locallyAddedEntries.forEach((localEntry) => {
                mergedEntries.push(localEntry);
                shouldMutate = true;
            });

            locallyModifiedEntries.forEach((locallyModifiedEntry) => {
                let mergedEntry = mergedEntries.find(entry => entry.id === locallyModifiedEntry.id);
                if (mergedEntry !== undefined
                    && locallyModifiedEntry.text.match(/\S/)) {
                    mergedEntry.text = locallyModifiedEntry.text;
                    shouldMutate = true;
                }
            });

            if (shouldMutate) {
                openmct.objects.mutate(mutable, `configuration.entries.${sectionKey}.${pageKey}`, mergedEntries);
            }
        });
    });
}
