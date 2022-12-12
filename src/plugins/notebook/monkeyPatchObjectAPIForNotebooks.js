import { isAnnotationType, isNotebookType, isNotebookOrAnnotationType } from './notebook-constants';
import _ from 'lodash';

export default function (openmct) {
    const apiSave = openmct.objects.save.bind(openmct.objects);

    openmct.objects.save = async (saveObject) => {
        let domainObject = cloneObject(saveObject);
        if (!isNotebookOrAnnotationType(saveObject)) {
            return apiSave(saveObject);
        }

        // const isNewMutable = !domainObject.isMutable;
        // const localMutable = openmct.objects.toMutable(domainObject);
        let result;

        try {
            console.log('monkeypatch save');
            result = await apiSave(saveObject);
            // result = await apiSave(localMutable);
        } catch (error) {
            console.log('monkeypatch save error', error);
            if (error instanceof openmct.objects.errors.Conflict) {
                console.log('we got ourselves a conflict');
                result = await resolveConflicts(domainObject, openmct);
                // result = await resolveConflicts(domainObject, localMutable, openmct);
            } else {
                result = Promise.reject(error);
            }
        } finally {
            // if (isNewMutable) {
            //     openmct.objects.destroyMutable(localMutable);
            // }
        }

        return result;
    };
}

// function resolveConflicts(domainObject, localMutable, openmct) {
function resolveConflicts(domainObject, openmct) {
    if (isNotebookType(domainObject)) {
        return resolveNotebookEntryConflicts(domainObject, openmct);
        // return resolveNotebookEntryConflicts(localMutable, openmct);
    } else if (isAnnotationType(domainObject)) {
        return resolveNotebookTagConflicts(domainObject, openmct);
        // return resolveNotebookTagConflicts(localMutable, openmct);
    }
}

async function resolveNotebookTagConflicts(localAnnotation, openmct) {
    const localClonedAnnotation = cloneObject(localAnnotation);
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

// async function resolveNotebookEntryConflicts(localMutable, openmct) {
async function resolveNotebookEntryConflicts(domainObject, openmct) {
    if (domainObject.configuration.entries) {
    // if (localMutable.configuration.entries) {
        // const localEntries = structuredClone(localMutable.configuration.entries);
        // const remoteObject = await openmct.objects.remoteGet(localMutable.identifier);
        const localEntries = domainObject.configuration.entries;
        const remoteObject = await openmct.objects.remoteGet(domainObject.identifier);

        return applyLocalEntries(remoteObject, localEntries, openmct);
        // openmct.objects.destroyMutable(remoteMutable);
    }

    return true;
}

function applyLocalEntries(remoteObject, entries, openmct) {
    console.log('apply local entries', entries, 'and remote entries', remoteObject.configuration.entries);
    Object.entries(entries).forEach(([sectionKey, pagesInSection]) => {
        Object.entries(pagesInSection).forEach(([pageKey, localEntries]) => {
            const remoteEntries = remoteObject.configuration.entries[sectionKey][pageKey];
            const mergedEntries = [].concat(remoteEntries);
            let shouldSave = false;

            const locallyAddedEntries = _.differenceBy(localEntries, remoteEntries, 'id');
            const locallyModifiedEntries = _.differenceWith(localEntries, remoteEntries, (localEntry, remoteEntry) => {
                return localEntry.id === remoteEntry.id && localEntry.text === remoteEntry.text;
            });

            console.log('locally added', locallyAddedEntries);
            console.log('locally modified', locallyModifiedEntries);
            locallyAddedEntries.forEach((localEntry) => {
                mergedEntries.push(localEntry);
                shouldSave = true;
            });

            locallyModifiedEntries.forEach((locallyModifiedEntry) => {
                let mergedEntry = mergedEntries.find(entry => entry.id === locallyModifiedEntry.id);
                if (mergedEntry !== undefined
                    && locallyModifiedEntry.text.match(/\S/)) {
                    mergedEntry.text = locallyModifiedEntry.text;
                    shouldSave = true;
                }
            });
            console.log('mergedEntries', mergedEntries);

            if (shouldSave) {
                remoteObject.configuration.entries = mergedEntries;
                console.log('save this one', remoteObject);
                return openmct.objects.save(remoteObject);
                // openmct.objects.save(remoteObject, `configuration.entries.${sectionKey}.${pageKey}`, mergedEntries);
            }
        });
    });
}

function cloneObject(object) {
    if (typeof window.structuredClone === 'function') {
        return structuredClone(object);
    } else {
        return JSON.parse(JSON.stringify(object));
    }
}
