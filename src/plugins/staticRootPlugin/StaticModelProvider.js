define([
    'objectUtils',
    'uuid'
], function (
    objectUtils,
    uuid
) {
    /**
     * Transforms an import json blob into a object map that can be used to
     * provide objects.  Rewrites root identifier in import data with provided
     * rootIdentifier, and rewrites all child object identifiers so that they
     * exist in the same namespace as the rootIdentifier.
     */
    function rewriteObjectIdentifiers(importData, rootIdentifier) {
        const namespace = rootIdentifier.namespace;
        const idMap = new Map();

        Object.keys(importData.openmct).forEach((originalId) => {
            if (originalId === importData.rootId) {
                idMap.set(originalId, rootIdentifier.key);
            } else {
                idMap.set(originalId, uuid());
            }
        });

        Object.keys(importData.openmct).forEach((originalId) => {
            const newUUID = idMap.get(originalId);
            if (importData.openmct[originalId] && importData.openmct[originalId].identifier) {
                importData.openmct[originalId].identifier.key = newUUID;
                importData.openmct[originalId].identifier.namespace = namespace;
            }

            if (importData.openmct[originalId] && importData.openmct[originalId].composition) {
                importData.openmct[originalId].composition.forEach((compositionObject) => {
                    const childObjectKey = objectUtils.makeKeyString({
                        namespace: compositionObject.namespace,
                        key: compositionObject.key
                    });
                    importData.openmct[childObjectKey].location = objectUtils.makeKeyString({
                        namespace,
                        key: newUUID
                    });
                    compositionObject.key = idMap.get(compositionObject.key);
                    compositionObject.namespace = namespace;
                });
            }

            const objectId = objectUtils.makeKeyString({
                namespace,
                key: newUUID
            });
            importData.openmct[objectId] = importData.openmct[originalId];
            delete importData.openmct[originalId];
        });

        return importData.openmct;
    }

    /**
     * Converts all objects in an object make from old format objects to new
     * format objects.
     */
    function convertToNewObjects(oldObjectMap) {
        return Object.keys(oldObjectMap)
            .reduce(function (newObjectMap, key) {
                newObjectMap[key] = objectUtils.toNewFormat(oldObjectMap[key], key);

                return newObjectMap;
            }, {});
    }

    /* Set the root location correctly for a top-level object */
    function setRootLocation(objectMap, rootIdentifier) {
        objectMap[objectUtils.makeKeyString(rootIdentifier)].location = 'ROOT';

        return objectMap;
    }

    /**
     * Takes importData (as provided by the ImportExport plugin) and exposes
     * an object provider to fetch those objects.
     */
    function StaticModelProvider(importData, rootIdentifier) {
        const oldFormatObjectMap = rewriteObjectIdentifiers(importData, rootIdentifier);
        const newFormatObjectMap = convertToNewObjects(oldFormatObjectMap);
        this.objectMap = setRootLocation(newFormatObjectMap, rootIdentifier);
    }

    /**
     * Standard "Get".
     */
    StaticModelProvider.prototype.get = function (identifier) {
        const keyString = objectUtils.makeKeyString(identifier);
        if (this.objectMap[keyString]) {
            return this.objectMap[keyString];
        }

        throw new Error(keyString + ' not found in import models.');
    };

    return StaticModelProvider;

});
