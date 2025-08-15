/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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

import { EventEmitter } from 'eventemitter3';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';

/**
 * @readonly
 * @enum {string} AnnotationType
 * @property {string} NOTEBOOK The notebook annotation type
 * @property {string} GEOSPATIAL The geospatial annotation type
 * @property {string} PIXEL_SPATIAL The pixel-spatial annotation type
 * @property {string} TEMPORAL The temporal annotation type
 * @property {string} PLOT_SPATIAL The plot-spatial annotation type
 */
const ANNOTATION_TYPES = Object.freeze({
  NOTEBOOK: 'NOTEBOOK',
  GEOSPATIAL: 'GEOSPATIAL',
  PIXEL_SPATIAL: 'PIXEL_SPATIAL',
  TEMPORAL: 'TEMPORAL',
  PLOT_SPATIAL: 'PLOT_SPATIAL'
});

/**
 * @type {string}
 */
const ANNOTATION_TYPE = 'annotation';

/**
 * @type {string}
 */
const ANNOTATION_LAST_CREATED = 'annotationLastCreated';

/**
 * @typedef {Object} Tag
 * @property {string} key a unique identifier for the tag
 * @property {string} backgroundColor eg. "#cc0000"
 * @property {string} foregroundColor eg. "#ffffff"
 */

/**
 * @typedef {import('openmct').DomainObject} DomainObject
 */

/**
 * @typedef {import('openmct').Identifier} Identifier
 */

/**
 * @typedef {import('openmct').OpenMCT} OpenMCT
 */

/**
 * An interface for interacting with annotations of domain objects.
 * An annotation of a domain object is an operator created object for the purposes
 * of further describing data in plots, notebooks, maps, etc. For example, an annotation
 * could be a tag on a plot notating an interesting set of points labeled SCIENCE. It could
 * also be set of notebook entries the operator has tagged DRIVING when a robot monitored by OpenMCT
 * about rationals behind why the robot has taken a certain path.
 * Annotations are discoverable using search, and are typically rendered in OpenMCT views to bring attention
 * to other users.
 * @class AnnotationAPI
 * @extends {EventEmitter}
 */
export default class AnnotationAPI extends EventEmitter {
  /** @type {Map<ANNOTATION_TYPES, Array<(a, b) => boolean >>} */
  #targetComparatorMap;

  /**
   * @param {OpenMCT} openmct
   */
  constructor(openmct) {
    super();
    this.openmct = openmct;
    this.availableTags = {};
    this.namespaceToSaveAnnotations = '';
    this.#targetComparatorMap = new Map();

    this.ANNOTATION_TYPES = ANNOTATION_TYPES;
    this.ANNOTATION_TYPE = ANNOTATION_TYPE;
    this.ANNOTATION_LAST_CREATED = ANNOTATION_LAST_CREATED;

    this.openmct.types.addType(ANNOTATION_TYPE, {
      name: 'Annotation',
      description:
        'A user created note or comment about time ranges, pixel space, and geospatial features.',
      creatable: false,
      cssClass: 'icon-notebook',
      initialize: function (domainObject) {
        domainObject.targets = domainObject.targets || [];
        domainObject._deleted = domainObject._deleted || false;
        domainObject.originalContextPath = domainObject.originalContextPath || '';
        domainObject.tags = domainObject.tags || [];
        domainObject.contentText = domainObject.contentText || '';
        domainObject.annotationType = domainObject.annotationType || 'plotspatial';
      }
    });
  }
  /**
   * Creates an annotation on a given domain object (e.g., a plot) and a set of targets (e.g., telemetry objects)
   * @typedef {Object} CreateAnnotationOptions
   * @property {string} name a name for the new annotation (e.g., "Plot annnotation")
   * @property {DomainObject} domainObject the domain object this annotation was created with
   * @property {ANNOTATION_TYPES} annotationType the type of annotation to create (e.g., PLOT_SPATIAL)
   * @property {Tag[]} tags tags to add to the annotation, e.g., SCIENCE for science related annotations
   * @property {string} contentText Some text to add to the annotation, e.g. ("This annotation is about science")
   * @property {Array<Object>} targets The targets ID keystrings and their specific properties.
   * For plots, this will be a bounding box, e.g.: {keyString: "d8385009-789d-457b-acc7-d50ba2fd55ea", maxY: 100, minY: 0, maxX: 100, minX: 0}
   * For notebooks, this will be an entry ID, e.g.: {entryId: "entry-ecb158f5-d23c-45e1-a704-649b382622ba"}
   * @property {DomainObject[]} targetDomainObjects the domain objects this annotation points to (e.g., telemetry objects for a plot)
   */
  /**
   * @param {CreateAnnotationOptions} options
   * @returns {Promise<DomainObject>} a promise which will resolve when the domain object
   *          has been created, or be rejected if it cannot be saved
   */
  async create({
    name,
    domainObject,
    annotationType,
    tags,
    contentText,
    targets,
    targetDomainObjects
  }) {
    if (!Object.keys(this.ANNOTATION_TYPES).includes(annotationType)) {
      throw new Error(`Unknown annotation type: ${annotationType}`);
    }

    if (!targets.length) {
      throw new Error(`At least one target is required to create an annotation`);
    }

    if (targets.some((target) => !target.keyString)) {
      throw new Error(`All targets require a keyString to create an annotation`);
    }

    if (!targetDomainObjects.length) {
      throw new Error(`At least one targetDomainObject is required to create an annotation`);
    }

    const domainObjectKeyString = this.openmct.objects.makeKeyString(domainObject.identifier);
    const originalPathObjects = await this.openmct.objects.getOriginalPath(domainObjectKeyString);
    const originalContextPath = this.openmct.objects.getRelativePath(originalPathObjects);
    const namespace = this.namespaceToSaveAnnotations;
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
      targetDomainObjects.forEach((targetDomainObject) => {
        this.#updateAnnotationModified(targetDomainObject);
      });

      return createdObject;
    } else {
      throw new Error('Failed to create object');
    }
  }

  /**
   * Updates the annotation modified timestamp for a target domain object
   * @param {DomainObject} targetDomainObject The target domain object to update
   */
  #updateAnnotationModified(targetDomainObject) {
    // As certain telemetry objects are immutable, we'll need to check here first
    // to see if we can add the annotation last created property.
    // TODO: This should be removed once we have a better way to handle immutable telemetry objects
    if (targetDomainObject.isMutable) {
      this.openmct.objects.mutate(targetDomainObject, this.ANNOTATION_LAST_CREATED, Date.now());
    } else {
      this.emit('targetDomainObjectAnnotated', targetDomainObject);
    }
  }

  /**
   * Defines a new tag
   * @param {string} tagKey a unique identifier for the tag
   * @param {Tag} tagsDefinition the definition of the tag to add
   */
  defineTag(tagKey, tagsDefinition) {
    this.availableTags[tagKey] = tagsDefinition;
  }

  /**
   * Sets the namespace to save new annotations to
   * @param {string} namespace the namespace to save new annotations to
   */
  setNamespaceToSaveAnnotations(namespace) {
    this.namespaceToSaveAnnotations = namespace;
  }

  /**
   * Checks if a domain object is an annotation
   * @param {DomainObject} domainObject the domainObject in question
   * @returns {boolean} Returns true if the domain object is an annotation
   */
  isAnnotation(domainObject) {
    return domainObject && domainObject.type === ANNOTATION_TYPE;
  }

  /**
   * Gets the available tags that have been loaded
   * @returns {Tag[]} Returns an array of the available tags that have been loaded
   */
  getAvailableTags() {
    if (this.availableTags) {
      const rearrangedToArray = Object.keys(this.availableTags).map((tagKey) => {
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
   * Gets annotations for a given domain object identifier
   * @param {Identifier} domainObjectIdentifier - The domain object identifier to use to search for annotations. For example, a telemetry object identifier.
   * @param {AbortSignal} [abortSignal] - An abort signal to cancel the search
   * @returns {Promise<DomainObject[]>} Returns a promise that resolves to an array of annotations that match the search query
   */
  async getAnnotations(domainObjectIdentifier, abortSignal = null) {
    const keyStringQuery = this.openmct.objects.makeKeyString(domainObjectIdentifier);
    const searchResults = (
      await Promise.all(
        this.openmct.objects.search(
          keyStringQuery,
          abortSignal,
          this.openmct.objects.SEARCH_TYPES.ANNOTATIONS
        )
      )
    ).flat();

    return searchResults;
  }

  /**
   * Deletes (marks as deleted) the given annotations
   * @param {DomainObject[]} annotations - An array of annotations to delete (set _deleted to true)
   */
  deleteAnnotations(annotations) {
    if (!annotations) {
      throw new Error('Asked to delete null annotations! 🙅‍♂️');
    }

    annotations.forEach((annotation) => {
      if (!annotation._deleted) {
        this.openmct.objects.mutate(annotation, '_deleted', true);
      }
    });
  }

  /**
   * Undeletes (marks as not deleted) the given annotation
   * @param {DomainObject} annotation - An annotation to undelete (set _deleted to false)
   */
  unDeleteAnnotation(annotation) {
    if (!annotation) {
      throw new Error('Asked to undelete null annotation! 🙅‍♂️');
    }

    this.openmct.objects.mutate(annotation, '_deleted', false);
  }

  /**
   * Gets tags from the given annotations
   * @param {DomainObject[]} annotations - The annotations to get tags from
   * @param {boolean} [filterDuplicates=true] - Whether to filter out duplicate tags
   * @returns {Tag[]} An array of tags from the given annotations
   */
  getTagsFromAnnotations(annotations, filterDuplicates = true) {
    if (!annotations) {
      return [];
    }

    let tagsFromAnnotations = annotations.flatMap((annotation) => {
      if (annotation._deleted) {
        return [];
      } else {
        return annotation.tags;
      }
    });

    if (filterDuplicates) {
      tagsFromAnnotations = tagsFromAnnotations.filter((tag, index, tagArray) => {
        return tagArray.indexOf(tag) === index;
      });
    }

    const fullTagModels = this.#addTagMetaInformationToTags(tagsFromAnnotations);

    return fullTagModels;
  }

  /**
   * Adds meta information to the given tags
   * @param {string[]} tags - The tags to add meta information to
   * @returns {Tag[]} An array of tags with meta information added
   */
  #addTagMetaInformationToTags(tags) {
    // Convert to Set and back to Array to remove duplicates
    const uniqueTags = [...new Set(tags)];

    return uniqueTags.map((tagKey) => {
      const tagModel = this.availableTags[tagKey];
      tagModel.tagID = tagKey;

      return tagModel;
    });
  }

  /**
   * Gets tags that match the given query
   * @param {string} query - The query to match tags against
   * @returns {string[]} An array of tag keys that match the query
   */
  #getMatchingTags(query) {
    if (!query) {
      return [];
    }

    const matchingTags = Object.keys(this.availableTags).filter((tagKey) => {
      if (this.availableTags[tagKey] && this.availableTags[tagKey].label) {
        return this.availableTags[tagKey].label.toLowerCase().includes(query.toLowerCase());
      }

      return false;
    });

    return matchingTags;
  }

  /**
   * @typedef {Object} AnnotationTarget
   * @property {string} keyString - The key string of the target
   * @property {*} [additionalProperties] - Additional properties depending on the annotation type
   */

  /**
   * @typedef {Object} TargetModel
   * @property {import('openmct').DomainObject[]} originalPath - The original path of the target object
   * @property {*} [additionalProperties] - Additional properties of the target domain object
   */

  /**
   * @typedef {Object} AnnotationResult
   * @property {string} name - The name of the annotation
   * @property {string} type - The type of the object (always 'annotation')
   * @property {{key: string, namespace: string}} identifier - The identifier of the annotation
   * @property {string[]} tags - Array of tag keys associated with the annotation
   * @property {boolean} _deleted - Whether the annotation is marked as deleted
   * @property {ANNOTATION_TYPES} annotationType - The type of the annotation
   * @property {string} contentText - The text content of the annotation
   * @property {string} originalContextPath - The original context path of the annotation
   * @property {AnnotationTarget[]} targets - Array of targets for the annotation
   * @property {Tag[]} fullTagModels - Full tag models including metadata
   * @property {string[]} matchingTagKeys - Array of tag keys that matched the search query
   * @property {TargetModel[]} targetModels - Array of target models with additional information
   */

  /**
   * Combines annotations with the same targets
   * @param {AnnotationResult[]} results - The results to combine
   * @returns {AnnotationResult[]} The combined results
   */
  #combineSameTargets(results) {
    const combinedResults = [];
    results.forEach((currentAnnotation) => {
      const existingAnnotation = combinedResults.find((annotationToFind) => {
        const { annotationType, targets } = currentAnnotation;
        return this.areAnnotationTargetsEqual(annotationType, targets, annotationToFind.targets);
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
   * Breaks apart annotations with multiple targets into separate results
   * @param {AnnotationResult[]} results - The results to break apart
   * @returns {AnnotationResult[]} The separated results
   */
  #breakApartSeparateTargets(results) {
    const separateResults = [];
    results.forEach((result) => {
      result.targets.forEach((target) => {
        const targetID = target.keyString;
        const separatedResult = {
          ...result
        };
        separatedResult.targets = [target];
        separatedResult.targetModels = result.targetModels.filter((targetModel) => {
          const targetKeyString = this.openmct.objects.makeKeyString(targetModel.identifier);

          return targetKeyString === targetID;
        });
        separateResults.push(separatedResult);
      });
    });

    return separateResults;
  }

  /**
   * Adds tag meta information to the given results
   * @param {AnnotationResult[]} results - The results to add tag meta information to
   * @param {string[]} matchingTagKeys - The matching tag keys
   * @returns {AnnotationResult[]} The results with tag meta information added
   */
  #addTagMetaInformationToResults(results, matchingTagKeys) {
    const tagsAddedToResults = results.map((result) => {
      const fullTagModels = this.#addTagMetaInformationToTags(result.tags);

      return {
        fullTagModels,
        matchingTagKeys,
        ...result
      };
    });

    return tagsAddedToResults;
  }

  /**
   * Adds target models to the results
   * @param {AnnotationResult[]} results - The results to add target models to
   * @param {AbortSignal} abortSignal - The abort signal
   * @returns {Promise<AnnotationResult[]>} The results with target models added
   */
  async #addTargetModelsToResults(results, abortSignal) {
    const modelAddedToResults = await Promise.all(
      results.map(async (result) => {
        const targetModels = await Promise.all(
          result.targets.map(async (target) => {
            const targetID = target.keyString;
            const targetModel = await this.openmct.objects.get(targetID, abortSignal);
            const targetKeyString = this.openmct.objects.makeKeyString(targetModel.identifier);
            const originalPathObjects = await this.openmct.objects.getOriginalPath(
              targetKeyString,
              [],
              abortSignal
            );

            return {
              originalPath: originalPathObjects,
              ...targetModel
            };
          })
        );

        return {
          targetModels,
          ...result
        };
      })
    );

    return modelAddedToResults;
  }

  /**
   * Searches for tags matching the given query
   * @param {string} query - A query to match against tags
   * @param {AbortSignal} [abortSignal] - An optional abort signal to stop the query
   * @returns {Promise<AnnotationResult[]>} A promise that resolves to an array of matching annotation results
   */
  async searchForTags(query, abortSignal) {
    const matchingTagKeys = this.#getMatchingTags(query);
    if (!matchingTagKeys.length) {
      return [];
    }

    const searchResults = (
      await Promise.all(
        this.openmct.objects.search(
          matchingTagKeys,
          abortSignal,
          this.openmct.objects.SEARCH_TYPES.TAGS
        )
      )
    ).flat();
    const filteredDeletedResults = searchResults.filter((result) => {
      return !result._deleted;
    });
    const combinedSameTargets = this.#combineSameTargets(filteredDeletedResults);
    const appliedTagSearchResults = this.#addTagMetaInformationToResults(
      combinedSameTargets,
      matchingTagKeys
    );
    const appliedTargetsModels = await this.#addTargetModelsToResults(
      appliedTagSearchResults,
      abortSignal
    );
    const resultsWithValidPath = appliedTargetsModels.filter((result) => {
      return this.openmct.objects.isReachable(result.targetModels?.[0]?.originalPath);
    });
    const breakApartSeparateTargets = this.#breakApartSeparateTargets(resultsWithValidPath);

    return breakApartSeparateTargets;
  }

  /**
   * Adds a comparator function for a given annotation type.
   * The comparator functions will be used to determine if two annotations
   * have the same target.
   * @param {ANNOTATION_TYPES} annotationType
   * @param {(t1, t2) => boolean} comparator
   */
  addTargetComparator(annotationType, comparator) {
    const comparatorList = this.#targetComparatorMap.get(annotationType) ?? [];
    comparatorList.push(comparator);
    this.#targetComparatorMap.set(annotationType, comparatorList);
  }

  /**
   * Compare two sets of targets to see if they are equal. First checks if
   * any targets comparators evaluate to true, then falls back to a deep
   * equality check.
   * @param {ANNOTATION_TYPES} annotationType
   * @param {*} targets
   * @param {*} otherTargets
   * @returns true if the targets are equal, false otherwise
   */
  areAnnotationTargetsEqual(annotationType, targets, otherTargets) {
    const targetComparatorList = this.#targetComparatorMap.get(annotationType);
    return (
      (targetComparatorList?.length &&
        targetComparatorList.some((targetComparator) => targetComparator(targets, otherTargets))) ||
      _.isEqual(targets, otherTargets)
    );
  }
}
