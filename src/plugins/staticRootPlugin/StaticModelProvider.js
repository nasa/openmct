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
    function parseObjectLeaf(objectLeaf, idMap, namespace) {
        Object.keys(objectLeaf).forEach((nodeKey) => {
            if (idMap.get(nodeKey)) {
                const newIdentifier = objectUtils.makeKeyString({
                    namespace,
                    key: idMap.get(nodeKey)
                });
                objectLeaf[newIdentifier] = { ...objectLeaf[nodeKey] };
                delete objectLeaf[nodeKey];
                objectLeaf[newIdentifier] = parseTreeLeaf(newIdentifier, objectLeaf[newIdentifier], idMap, namespace);
            } else {
                objectLeaf[nodeKey] = parseTreeLeaf(nodeKey, objectLeaf[nodeKey], idMap, namespace);
            }
        });

        return objectLeaf;
    }

    function parseArrayLeaf(arrayLeaf, idMap, namespace) {
        arrayLeaf.forEach((leafValue, index) => {
            arrayLeaf[index] = parseTreeLeaf(null, leafValue, idMap, namespace);
        });

        return arrayLeaf;
    }

    function parseBranchedLeaf(branchedLeafValue, idMap, namespace) {
        if (Array.isArray(branchedLeafValue)) {
            return parseArrayLeaf(branchedLeafValue, idMap, namespace);
        } else {
            return parseObjectLeaf(branchedLeafValue, idMap, namespace);
        }
    }

    function parseTreeLeaf(leafKey, leafValue, idMap, namespace) {
        const hasChild = typeof leafValue === 'object';
        if (hasChild) {
            return parseBranchedLeaf(leafValue, idMap, namespace);
        }

        if (leafKey === 'key') {
            return idMap.get(leafValue);
        } else if (leafKey === 'namespace') {
            return namespace;
        } else if (leafKey === 'location') {
            if (idMap.get(leafValue)) {
                const newLocationIdentifier = objectUtils.makeKeyString({
                    namespace,
                    key: idMap.get(leafValue)
                });

                return newLocationIdentifier;
            }

            return null;
        } else if (idMap.get(leafValue)) {
            const newIdentifier = objectUtils.makeKeyString({
                namespace,
                key: idMap.get(leafValue)
            });

            return newIdentifier;
        } else {
            return leafValue;
        }
    }

    function rewriteObjectIdentifiers(importData, rootIdentifier) {
        const namespace = rootIdentifier.namespace;
        const idMap = new Map();
        const objectTree = importData.openmct;

        Object.keys(objectTree).forEach((originalId, index) => {
            if (originalId === importData.rootId) {
                idMap.set(originalId, rootIdentifier.key);
            } else {
                idMap.set(originalId, index.toString());
            }
        });

        const newTree = parseTreeLeaf(null, objectTree, idMap, namespace);

        return newTree;
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
