/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 * Transforms an import json blob into a object map that can be used to
 * provide objects.  Rewrites root identifier in import data with provided
 * rootIdentifier, and rewrites all child object identifiers so that they
 * exist in the same namespace as the rootIdentifier.
 */
import objectUtils from 'objectUtils';

class StaticModelProvider {
    constructor(importData, rootIdentifier) {
        this.objectMap = {};
        this.rewriteModel(importData, rootIdentifier);
    }

    /**
     * Standard "Get".
     */
    get(identifier) {
        const keyString = objectUtils.makeKeyString(identifier);
        if (this.objectMap[keyString]) {
            return this.objectMap[keyString];
        }

        throw new Error(keyString + ' not found in import models.');
    }

    parseObjectLeaf(objectLeaf, idMap, namespace) {
        Object.keys(objectLeaf).forEach((nodeKey) => {
            if (idMap.get(nodeKey)) {
                const newIdentifier = objectUtils.makeKeyString({
                    namespace,
                    key: idMap.get(nodeKey)
                });
                objectLeaf[newIdentifier] = { ...objectLeaf[nodeKey] };
                delete objectLeaf[nodeKey];
                objectLeaf[newIdentifier] = this.parseTreeLeaf(
                    newIdentifier,
                    objectLeaf[newIdentifier],
                    idMap,
                    namespace
                );
            } else {
                objectLeaf[nodeKey] = this.parseTreeLeaf(
                    nodeKey,
                    objectLeaf[nodeKey],
                    idMap,
                    namespace
                );
            }
        });

        return objectLeaf;
    }

    parseArrayLeaf(arrayLeaf, idMap, namespace) {
        return arrayLeaf.map((leafValue, index) =>
            this.parseTreeLeaf(null, leafValue, idMap, namespace)
        );
    }

    parseBranchedLeaf(branchedLeafValue, idMap, namespace) {
        if (Array.isArray(branchedLeafValue)) {
            return this.parseArrayLeaf(branchedLeafValue, idMap, namespace);
        } else {
            return this.parseObjectLeaf(branchedLeafValue, idMap, namespace);
        }
    }

    parseTreeLeaf(leafKey, leafValue, idMap, namespace) {
        if (leafValue === null || leafValue === undefined) {
            return leafValue;
        }

        const hasChild = typeof leafValue === 'object';
        if (hasChild) {
            return this.parseBranchedLeaf(leafValue, idMap, namespace);
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

    rewriteObjectIdentifiers(importData, rootIdentifier) {
        const namespace = rootIdentifier.namespace;
        const idMap = new Map();
        const objectTree = importData.openmct;

        Object.keys(objectTree).forEach((originalId, index) => {
            let newId = index.toString();
            if (originalId === importData.rootId) {
                newId = rootIdentifier.key;
            }

            idMap.set(originalId, newId);
        });

        const newTree = this.parseTreeLeaf(null, objectTree, idMap, namespace);

        return newTree;
    }

    /**
     * Converts all objects in an object make from old format objects to new
     * format objects.
     */
    convertToNewObjects(oldObjectMap) {
        return Object.keys(oldObjectMap).reduce(function (newObjectMap, key) {
            newObjectMap[key] = objectUtils.toNewFormat(oldObjectMap[key], key);

            return newObjectMap;
        }, {});
    }

    /* Set the root location correctly for a top-level object */
    setRootLocation(objectMap, rootIdentifier) {
        objectMap[objectUtils.makeKeyString(rootIdentifier)].location = 'ROOT';

        return objectMap;
    }

    /**
     * Takes importData (as provided by the ImportExport plugin) and exposes
     * an object provider to fetch those objects.
     */
    rewriteModel(importData, rootIdentifier) {
        const oldFormatObjectMap = this.rewriteObjectIdentifiers(
            importData,
            rootIdentifier
        );
        const newFormatObjectMap = this.convertToNewObjects(oldFormatObjectMap);
        this.objectMap = this.setRootLocation(
            newFormatObjectMap,
            rootIdentifier
        );
    }
}

export default StaticModelProvider;
