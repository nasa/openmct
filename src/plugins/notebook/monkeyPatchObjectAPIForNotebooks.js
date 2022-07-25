import { isNotebookType } from './notebook-constants';

export default function (openmct) {
    const apiSave = openmct.objects.save.bind(openmct.objects);

    openmct.objects.save = async (domainObject) => {
        if (!isNotebookType(domainObject)) {
            return apiSave(domainObject);
        }

        const isNewMutable = !domainObject.isMutable;
        const localMutable = openmct.objects._toMutable(domainObject);
        let result;

        try {
            result = await apiSave(localMutable);
        } catch (error) {
            if (error instanceof openmct.objects.errors.Conflict) {
                result = resolveConflicts(localMutable, openmct);
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

function resolveConflicts(localMutable, openmct) {
    const localEntries = JSON.parse(JSON.stringify(localMutable.configuration.entries));

    return openmct.objects.getMutable(localMutable.identifier).then((remoteMutable) => {
        applyLocalEntries(remoteMutable, localEntries, openmct);

        openmct.objects.destroyMutable(remoteMutable);

        return true;
    });
}

function applyLocalEntries(mutable, entries, openmct) {
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
