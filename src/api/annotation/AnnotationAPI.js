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

import uuid from 'uuid';
import availableTags from '../../../example/tags/tags.json';
import EventEmitter from 'EventEmitter';

export default class AnnotationAPI extends EventEmitter {
    constructor(openmct) {
        super();
        this.openmct = openmct;
        this.ANNOTATION_TYPES = Object.freeze({
            NOTEBOOK: 'notebook',
            GEOSPATIAL: 'geospatial',
            PIXEL_SPATIAL: 'pixelspatial',
            TEMPORAL: 'temporal',
            PLOT_SPATIAL: 'plotspatial'
        });

        this.openmct.types.addType('annotation', {
            name: 'Annotation',
            description: 'A user created note or comment about time ranges, pixel space, and geospatial features.',
            creatable: true,
            cssClass: 'icon-notebook',
            initialize: function (domainObject) {
                domainObject.targets = domainObject.targets || {};
                domainObject.originalContextPath = domainObject.originalContextPath || '';
                domainObject.tags = domainObject.tags || [];
                domainObject.contentText = domainObject.contentText || '';
                domainObject.annotationType = domainObject.annotationType || 'plotspatial';
            }
        });
    }

    /**
    * Create the a generic annotation
    *
    * @method create
    * @param {module:openmct.DomainObject} domainObject the domain object to
    *        create
    * @returns {Promise} a promise which will resolve when the domain object
    *          has been created, or be rejected if it cannot be saved
    */
    async create(name, domainObject, annotationType, tags, contentText, targets) {
        console.debug(`🍉 Creating annotation 🍉`);
        if (Object.keys(this.ANNOTATION_TYPES).includes(annotationType)) {
            throw new Error(`Unknown annotation type: ${annotationType}`);
        }

        if (!Object.keys(targets).length) {
            throw new Error(`At least one target is required to create an annotation`);
        }

        const domainObjectKeyString = this.openmct.objects.makeKeyString(domainObject.identifier);
        const originalPathObjects = await this.openmct.objects.getOriginalPath(domainObjectKeyString);
        const originalContextPath = this.openmct.objects.getRelativePath(originalPathObjects);
        const namespace = domainObject.identifier.namespace;
        // const location = this.openmct.objects.makeKeyString(domainObject.identifier);
        const location = originalContextPath;
        const type = 'annotation';
        const typeDefinition = this.openmct.types.get(type);
        const definition = typeDefinition.definition;

        const createdObject = {
            name,
            type,
            identifier: {
                key: uuid(),
                namespace
            },
            tags,
            annotationType,
            contentText,
            originalContextPath,
            location
        };

        if (definition.initialize) {
            definition.initialize(createdObject);
        }

        createdObject.targets = targets;
        createdObject.originalContextPath = originalContextPath;

        const success = await this.openmct.objects.save(createdObject);
        if (success) {
            this.emit('annotationCreated', createdObject);

            return createdObject;
        } else {
            throw new Error('Failed to create object');
        }
    }

    /**
    * Get annotations for a given domain object
    *
    * @method get
    * @param {module:openmct.DomainObject} domainObject the domain object to
    *        create
    * @returns {Promise} a promise which will resolve when the domain object
    *          has been created, or be rejected if it cannot be saved
    */
    async get(targetDomainObject) {
        if (!targetDomainObject) {
            return [];
        }

        const targetKeyString = this.openmct.objects.makeKeyString(targetDomainObject.identifier);
        let foundAnnotations = null;

        const searchResults = await (await Promise.all(this.openmct.objects.queryUsingProvider('searchForAnnotations', targetKeyString))).flat();
        if (searchResults) {
            foundAnnotations = searchResults;
        }

        if (targetDomainObject.composition && targetDomainObject.composition.length) {
            for (let i = 0; i < targetDomainObject.composition.length; i += 1) {
                const childIdentifierObject = {
                    identifier: targetDomainObject.composition[i]
                };
                const childAnnotations = await this.openmct.annotation.get(childIdentifierObject);
                if (childAnnotations && childAnnotations.length) {
                    childAnnotations.forEach(childAnnotation => {
                        // check if unique
                        const annotationExists = foundAnnotations.some(existingAnnotation => {
                            return this.openmct.objects.areIdsEqual(existingAnnotation.identifier, childAnnotation.identifier);
                        });
                        if (!annotationExists) {
                            foundAnnotations.push(childAnnotation);
                        }
                    });

                }
            }
        }

        return foundAnnotations;
    }

    getAvailableTags() {
        const rearrangedToArray = Object.keys(availableTags.tags).map(tagKey => {
            return {
                id: tagKey,
                ...availableTags.tags[tagKey]
            };
        });

        return rearrangedToArray;
    }

    async getNotebookAnnotation(entryId, targetDomainObject) {
        const targetKeyString = this.openmct.objects.makeKeyString(targetDomainObject.identifier);
        let foundAnnotation = null;
        const query = {
            targetKeyString,
            entryId
        };
        const searchResults = (await Promise.all(this.openmct.objects.queryUsingProvider('searchForNotebookAnnotations', query))).flat();
        if (searchResults) {
            foundAnnotation = searchResults[0];
        }

        return foundAnnotation;
    }

    async addNotebookAnnotationTag(entryId, targetDomainObject, tag) {
        console.debug(`Going to add ${tag}`);
        let existingAnnotation = await this.getNotebookAnnotation(entryId, targetDomainObject);

        if (!existingAnnotation) {
            const targets = {};
            const targetKeyString = this.openmct.objects.makeKeyString(targetDomainObject.identifier);
            targets[targetKeyString] = {
                entryId: entryId
            };

            existingAnnotation = await this.create('notebook entry tag', targetDomainObject, this.ANNOTATION_TYPES.NOTEBOOK, [], 'notebook entry tag', targets);
        }

        const tagArray = [tag, ...existingAnnotation.tags];
        this.openmct.objects.mutate(existingAnnotation, 'tags', tagArray);

        return existingAnnotation;
    }

    async removeNotebookAnnotationTag(entryId, targetDomainObject, tagToRemove) {
        console.debug(`Going to remove tag ${tagToRemove}`);
        let existingAnnotation = await this.getNotebookAnnotation(entryId, targetDomainObject);

        if (existingAnnotation && existingAnnotation.tags.includes(tagToRemove)) {
            const cleanedArray = existingAnnotation.tags.filter(extantTag => extantTag !== tagToRemove);
            this.openmct.objects.mutate(existingAnnotation, 'tags', cleanedArray);
        } else {
            throw new Error(`Asked to remove notebook tag (${tagToRemove}) that doesn't exist for ${entryId}`);
        }
    }

    async removeNotebookAnnotation(entryId, targetDomainObject) {
        // just removes tags on the annotation as we can't really delete objects
        const notebookAnnotationToRemove = await this.getNotebookAnnotation(entryId, targetDomainObject);
        if (notebookAnnotationToRemove && notebookAnnotationToRemove.tags) {
            this.openmct.objects.mutate(notebookAnnotationToRemove, 'tags', []);
        }
    }

    getMatchingTags(query) {
        if (!query) {
            return [];
        }

        const allTags = availableTags.tags;
        const matchingTags = Object.keys(allTags).filter(tagKey => {
            if (allTags[tagKey] && allTags[tagKey].label) {
                return allTags[tagKey].label.toLowerCase().includes(query.toLowerCase());
            }

            return false;
        });

        return matchingTags;
    }

    addTagMetaInformationToResults(results, matchingTagKeys) {
        const tagsAddedToResults = results.map(result => {
            const fullTagModels = result.tags.map(tagKey => {
                const tagModel = availableTags.tags[tagKey];
                tagModel.tagID = tagKey;

                return tagModel;
            });

            return {
                fullTagModels,
                matchingTagKeys,
                ...result
            };
        });

        return tagsAddedToResults;
    }

    async addTargetModelsToResults(results) {
        const modelAddedToResults = await Promise.all(results.map(async result => {
            const targetModels = await Promise.all(Object.keys(result.targets).map(async (targetID) => {
                const targetModel = await this.openmct.objects.get(targetID);
                const targetKeyString = this.openmct.objects.makeKeyString(targetModel.identifier);
                const originalPathObjects = await this.openmct.objects.getOriginalPath(targetKeyString);

                return {
                    originalPath: originalPathObjects,
                    ...targetModel
                };
            }));

            return {
                targetModels,
                ...result
            };
        }));

        return modelAddedToResults;
    }

    async searchForTags(query, abortController) {
        console.debug(`🦁`);
        // get matching tags first
        const matchingTagKeys = this.getMatchingTags(query);
        const searchResults = (await Promise.all(this.openmct.objects.queryUsingProvider('searchForTags', matchingTagKeys, abortController))).flat();
        const appliedTagSearchResults = this.addTagMetaInformationToResults(searchResults, matchingTagKeys);
        const appliedTargetsModels = await this.addTargetModelsToResults(appliedTagSearchResults);

        return appliedTargetsModels;
    }
}
