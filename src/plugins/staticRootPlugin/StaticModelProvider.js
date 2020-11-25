define([
    'objectUtils'
], function (
    objectUtils
) {
    /**
     * Transforms an import json blob into a object map that can be used to
     * provide objects.  Rewrites root identifier in import data with provided
     * rootIdentifier, and rewrites all child object identifiers so that they
     * exist in the same namespace as the rootIdentifier.
     */
    function rewriteObjectIdentifiers(importData, rootIdentifier) {
        const rootId = importData.rootId;
        let objectString = JSON.stringify(importData.openmct);

        Object.keys(importData.openmct).forEach(function (originalId, i) {
            let newId;
            if (originalId === rootId) {
                newId = objectUtils.makeKeyString(rootIdentifier);
            } else {
                newId = objectUtils.makeKeyString({
                    namespace: rootIdentifier.namespace,
                    key: i
                });
            }

            while (objectString.indexOf(originalId) !== -1) {
                objectString = objectString.replace(
                    '"' + originalId + '"',
                    '"' + newId + '"'
                );
            }
        });

        return JSON.parse(objectString);
    }

    /**
     * Convets all objects in an object make from old format objects to new
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
