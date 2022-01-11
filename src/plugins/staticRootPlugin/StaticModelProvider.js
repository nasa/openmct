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
        console.log('rewriteObjectIdentifiers');
        console.log(importData.openmct);
        const rootId = importData.rootId;

        let objectString = JSON.stringify(importData.openmct);
        Object.keys(importData.openmct).forEach(function (originalId, i) {
            let combinedId;
            if (originalId === rootId) {
                combinedId = objectUtils.makeKeyString(rootIdentifier);
            } else {
                combinedId = objectUtils.makeKeyString({
                    namespace: rootIdentifier.namespace,
                    key: i
                });
            }

            importData.openmct[combinedId] = importData.openmct[originalId];
            delete importData.openmct[originalId];

            let newId;
            if (originalId === rootId) {
                newId = rootIdentifier.key;
            } else {
                newId = i;
            }

            while (objectString.indexOf(originalId) !== -1) {
                objectString = objectString.replace(
                    '"' + originalId + '"',
                    '"' + newId + '"'
                );
            }

            while (objectString.indexOf('"namespace":""') !== -1) {
                objectString = objectString.replace('"namespace":""', `"namespace":"${rootIdentifier.namespace}"`);
            }
        });

        console.log(objectString);
        console.log(JSON.parse(objectString));
        console.log(generateNewIdentifiers(importData, rootIdentifier.namespace));

        return {};
    }

    function rewriteId(oldId, newId, tree) {
        let newIdKeyString = objectUtils.makeKeyString(newId);
        let oldIdKeyString = objectUtils.makeKeyString(oldId);
        tree = JSON.stringify(tree).replace(new RegExp(oldIdKeyString, 'g'), newIdKeyString);

        return JSON.parse(tree, (key, value) => {
            if (value !== undefined
                && value !== null
                && Object.prototype.hasOwnProperty.call(value, 'key')
                && Object.prototype.hasOwnProperty.call(value, 'namespace')
                && value.key === oldId.key
                && value.namespace === oldId.namespace) {
                return newId;
            } else {
                return value;
            }
        });
    }

    function generateNewIdentifiers(tree, namespace) {
        // For each domain object in the file, generate new ID, replace in tree
        debugger;
        Object.keys(tree.openmct).forEach(domainObjectId => {
            const newId = {
                namespace,
                key: uuid()
            };

            const oldId = objectUtils.parseKeyString(domainObjectId);

            tree = rewriteId(oldId, newId, tree);
        }, this);

        return tree;
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
