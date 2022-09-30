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

import { v4 as uuid } from 'uuid';
import EventEmitter from 'EventEmitter';
import _ from 'lodash';

/**
 * @readonly
 * @enum {String} AnnotationType
 * @property {String} NOTEBOOK The notebook annotation type
 * @property {String} GEOSPATIAL The geospatial annotation type
 * @property {String} PIXEL_SPATIAL The pixel-spatial annotation type
 * @property {String} TEMPORAL The temporal annotation type
 * @property {String} PLOT_SPATIAL The plot-spatial annotation type
 */
const ANNOTATION_TYPES = Object.freeze({
    NOTEBOOK: 'NOTEBOOK',
    GEOSPATIAL: 'GEOSPATIAL',
    PIXEL_SPATIAL: 'PIXEL_SPATIAL',
    TEMPORAL: 'TEMPORAL',
    PLOT_SPATIAL: 'PLOT_SPATIAL'
});

const ANNOTATION_TYPE = 'annotation';

const ANNOTATION_LAST_CREATED = 'annotationLastCreated';

/**
 * @typedef {Object} Tag
 * @property {String} key a unique identifier for the tag
 * @property {String} backgroundColor eg. "#cc0000"
 * @property {String} foregroundColor eg. "#ffffff"
 */

export default class AnnotationAPI extends EventEmitter {

    /**
     * @param {OpenMCT} openmct
     */
    constructor(openmct) {
        super();
        this.openmct = openmct;
        this.availableTags = {};

        this.ANNOTATION_TYPES = ANNOTATION_TYPES;
        this.ANNOTATION_TYPE = ANNOTATION_TYPE;
        this.ANNOTATION_LAST_CREATED = ANNOTATION_LAST_CREATED;

        this.openmct.types.addType(ANNOTATION_TYPE, {
            name: 'Annotation',
            description: 'A user created note or comment about time ranges, pixel space, and geospatial features.',
            creatable: false,
            cssClass: 'icon-notebook',
            initialize: function (domainObject) {
                domainObject.targets = domainObject.targets || {};
                domainObject._deleted = domainObject._deleted || false;
                domainObject.originalContextPath = domainObject.originalContextPath || '';
                domainObject.tags = domainObject.tags || [];
                domainObject.contentText = domainObject.contentText || '';
                domainObject.annotationType = domainObject.annotationType || 'plotspatial';
            }
        });
    }

    /**
    * Create the a generic annotation
    * @typedef {Object} CreateAnnotationOptions
    * @property {String} name a name for the new parameter
    * @property {import('../objects/ObjectAPI').DomainObject} domainObject the domain object to create
    * @property {ANNOTATION_TYPES} annotationType the type of annotation to create
    * @property {Tag[]} tags
    * @property {String} contentText
    * @property {import('../objects/ObjectAPI').Identifier[]} targets
    */
    /**
    * @method create
    * @param {CreateAnnotationOptions} options
    * @returns {Promise<import('../objects/ObjectAPI').DomainObject>} a promise which will resolve when the domain object
    *          has been created, or be rejected if it cannot be saved
    */
    async create({name, domainObject, annotationType, tags, contentText, targets}) {
        if (!Object.keys(this.ANNOTATION_TYPES).includes(annotationType)) {
            throw new Error(`Unknown annotation type: ${annotationType}`);
        }

        if (!Object.keys(targets).length) {
            throw new Error(`At least one target is required to create an annotation`);
        }

        const domainObjectKeyString = this.openmct.objects.makeKeyString(domainObject.identifier);
        const originalPathObjects = await this.openmct.objects.getOriginalPath(domainObjectKeyString);
        const originalContextPath = this.openmct.objects.getRelativePath(originalPathObjects);
        const namespace = domainObject.identifier.namespace;
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
            _deleted: false,
            annotationType,
            contentText,
            originalContextPath
        };

        if (definition.initialize) {
            definition.initialize(createdObject);
        }

        createdObject.targets = targets;
        createdObject.originalContextPath = originalContextPath;

        const success = await this.openmct.objects.save(createdObject);
        if (success) {
            this.emit('annotationCreated', createdObject);
            this.#updateAnnotationModified(domainObject);

            return createdObject;
        } else {
            throw new Error('Failed to create object');
        }
    }

    #updateAnnotationModified(domainObject) {
        this.openmct.objects.mutate(domainObject, this.ANNOTATION_LAST_CREATED, Date.now());
    }

    /**
    * @method defineTag
    * @param {String} key a unique identifier for the tag
    * @param {Tag} tagsDefinition the definition of the tag to add
    */
    defineTag(tagKey, tagsDefinition) {
        this.availableTags[tagKey] = tagsDefinition;
    }

    /**
    * @method isAnnotation
    * @param {import('../objects/ObjectAPI').DomainObject} domainObject domainObject the domainObject in question
    * @returns {Boolean} Returns true if the domain object is an annotation
    */
    isAnnotation(domainObject) {
        return domainObject && (domainObject.type === ANNOTATION_TYPE);
    }

    /**
    * @method getAvailableTags
    * @returns {Tag[]} Returns an array of the available tags that have been loaded
    */
    getAvailableTags() {
        if (this.availableTags) {
            const rearrangedToArray = Object.keys(this.availableTags).map(tagKey => {
                return {
                    id: tagKey,
                    ...this.availableTags[tagKey]
                };
            });

            return rearrangedToArray;
        } else {
            return [];
        }
    }

    /**
    * @method getAnnotations
    * @param {String} query - The keystring of the domain object to search for annotations for
    * @returns {import('../objects/ObjectAPI').DomainObject[]} Returns an array of domain objects that match the search query
    */
    async getAnnotations(query) {
        const searchResults = (await Promise.all(this.openmct.objects.search(query, null, this.openmct.objects.SEARCH_TYPES.ANNOTATIONS))).flat();

        return searchResults;
    }

    /**
    * @method addSingleAnnotationTag
    * @param {import('../objects/ObjectAPI').DomainObject=} existingAnnotation - An optional annotation to add the tag to. If not specified, we will create an annotation.
    * @param {import('../objects/ObjectAPI').DomainObject} targetDomainObject - The domain object the annotation will point to.
    * @param {Object=} targetSpecificDetails - Optional object to add to the target object. E.g., for notebooks this would be an entryID
    * @param {AnnotationType} annotationType - The type of annotation this is for.
    * @returns {import('../objects/ObjectAPI').DomainObject[]} Returns the annotation that was either created or passed as an existingAnnotation
    */
    async addSingleAnnotationTag(existingAnnotation, targetDomainObject, targetSpecificDetails, annotationType, tag) {
        if (!existingAnnotation) {
            const targets = {};
            const targetKeyString = this.openmct.objects.makeKeyString(targetDomainObject.identifier);
            targets[targetKeyString] = targetSpecificDetails;
            const contentText = `${annotationType} tag`;
            const annotationCreationArguments = {
                name: contentText,
                domainObject: targetDomainObject,
                annotationType,
                tags: [tag],
                contentText,
                targets
            };
            const newAnnotation = await this.create(annotationCreationArguments);

            return newAnnotation;
        } else {
            if (!existingAnnotation.tags.includes(tag)) {
                throw new Error(`Existing annotation did not contain tag ${tag}`);
            }

            if (existingAnnotation._deleted) {
                this.unDeleteAnnotation(existingAnnotation);
            }

            return existingAnnotation;
        }
    }

    /**
    * @method deleteAnnotations
    * @param {import('../objects/ObjectAPI').DomainObject[]} existingAnnotation - An array of annotations to delete (set _deleted to true)
    */
    deleteAnnotations(annotations) {
        if (!annotations) {
            throw new Error('Asked to delete null annotations! 🙅‍♂️');
        }

        annotations.forEach(annotation => {
            if (!annotation._deleted) {
                this.openmct.objects.mutate(annotation, '_deleted', true);
            }
        });
    }

    /**
    * @method deleteAnnotations
    * @param {import('../objects/ObjectAPI').DomainObject} existingAnnotation - An annotations to undelete (set _deleted to false)
    */
    unDeleteAnnotation(annotation) {
        if (!annotation) {
            throw new Error('Asked to undelete null annotation! 🙅‍♂️');
        }

        this.openmct.objects.mutate(annotation, '_deleted', false);
    }

    #getMatchingTags(query) {
        if (!query) {
            return [];
        }

        const matchingTags = Object.keys(this.availableTags).filter(tagKey => {
            if (this.availableTags[tagKey] && this.availableTags[tagKey].label) {
                return this.availableTags[tagKey].label.toLowerCase().includes(query.toLowerCase());
            }

            return false;
        });

        return matchingTags;
    }

    #addTagMetaInformationToResults(results, matchingTagKeys) {
        const tagsAddedToResults = results.map(result => {
            const fullTagModels = result.tags.map(tagKey => {
                const tagModel = this.availableTags[tagKey];
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

    async #addTargetModelsToResults(results) {
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

    #combineSameTargets(results) {
        const combinedResults = [];
        results.forEach(currentAnnotation => {
            const existingAnnotation = combinedResults.find((annotationToFind) => {
                return _.isEqual(currentAnnotation.targets, annotationToFind.targets);
            });
            if (!existingAnnotation) {
                combinedResults.push(currentAnnotation);
            } else {
                existingAnnotation.tags.push(...currentAnnotation.tags);
            }
        });

        return combinedResults;
    }

    /**
    * @method searchForTags
    * @param {String} query A query to match against tags. E.g., "dr" will match the tags "drilling" and "driving"
    * @param {Object} [abortController] An optional abort method to stop the query
    * @returns {Promise} returns a model of matching tags with their target domain objects attached
    */
    async searchForTags(query, abortController) {
        const matchingTagKeys = this.#getMatchingTags(query);
        const searchResults = (await Promise.all(this.openmct.objects.search(matchingTagKeys, abortController, this.openmct.objects.SEARCH_TYPES.TAGS))).flat();
        const filteredDeletedResults = searchResults.filter((result) => {
            return !(result._deleted);
        });
        const combinedSameTargets = this.#combineSameTargets(filteredDeletedResults);
        const appliedTagSearchResults = this.#addTagMetaInformationToResults(combinedSameTargets, matchingTagKeys);
        const appliedTargetsModels = await this.#addTargetModelsToResults(appliedTagSearchResults);
        const resultsWithValidPath = appliedTargetsModels.filter(result => {
            return this.openmct.objects.isReachable(result.targetModels?.[0]?.originalPath);
        });

        return resultsWithValidPath;
    }
}
