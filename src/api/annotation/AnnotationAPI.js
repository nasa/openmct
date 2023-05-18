/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

/**
 * @typedef {import('../objects/ObjectAPI').DomainObject} DomainObject
 */

/**
 * @typedef {import('../objects/ObjectAPI').Identifier} Identifier
 */

/**
 * @typedef {import('../../../openmct').OpenMCT} OpenMCT
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
 * @constructor
 */
export default class AnnotationAPI extends EventEmitter {
  /**
   * @param {OpenMCT} openmct
   */
  constructor(openmct) {
    super();
    this.openmct = openmct;
    this.availableTags = {};
    this.namespaceToSaveAnnotations = '';

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
   * Creates an annotation on a given domain object (e.g., a plot) and a set of targets (e.g., telemetry objects)
   * @typedef {Object} CreateAnnotationOptions
   * @property {String} name a name for the new annotation (e.g., "Plot annnotation")
   * @property {DomainObject} domainObject the domain object this annotation was created with
   * @property {ANNOTATION_TYPES} annotationType the type of annotation to create (e.g., PLOT_SPATIAL)
   * @property {Tag[]} tags tags to add to the annotation, e.g., SCIENCE for science related annotations
   * @property {String} contentText Some text to add to the annotation, e.g. ("This annotation is about science")
   * @property {Object<string, Object>} targets The targets ID keystrings and their specific properties.
   * For plots, this will be a bounding box, e.g.: {maxY: 100, minY: 0, maxX: 100, minX: 0}
   * For notebooks, this will be an entry ID, e.g.: {entryId: "entry-ecb158f5-d23c-45e1-a704-649b382622ba"}
   * @property {DomainObject>} targetDomainObjects the targets ID keystrings and the domain objects this annotation points to (e.g., telemetry objects for a plot)
   */
  /**
   * @method create
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

    if (!Object.keys(targets).length) {
      throw new Error(`At least one target is required to create an annotation`);
    }

    if (!Object.keys(targetDomainObjects).length) {
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
      Object.values(targetDomainObjects).forEach((targetDomainObject) => {
        this.#updateAnnotationModified(targetDomainObject);
      });

      return createdObject;
    } else {
      throw new Error('Failed to create object');
    }
  }

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
   * @method defineTag
   * @param {String} key a unique identifier for the tag
   * @param {Tag} tagsDefinition the definition of the tag to add
   */
  defineTag(tagKey, tagsDefinition) {
    this.availableTags[tagKey] = tagsDefinition;
  }

  /**
   * @method setNamespaceToSaveAnnotations
   * @param {String} namespace the namespace to save new annotations to
   */
  setNamespaceToSaveAnnotations(namespace) {
    this.namespaceToSaveAnnotations = namespace;
  }

  /**
   * @method isAnnotation
   * @param {DomainObject} domainObject the domainObject in question
   * @returns {Boolean} Returns true if the domain object is an annotation
   */
  isAnnotation(domainObject) {
    return domainObject && domainObject.type === ANNOTATION_TYPE;
  }

  /**
   * @method getAvailableTags
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
   * @method getAnnotations
   * @param {Identifier} domainObjectIdentifier - The domain object identifier to use to search for annotations. For example, a telemetry object identifier.
   * @returns {DomainObject[]} Returns an array of annotations that match the search query
   */
  async getAnnotations(domainObjectIdentifier) {
    const keyStringQuery = this.openmct.objects.makeKeyString(domainObjectIdentifier);
    const searchResults = (
      await Promise.all(
        this.openmct.objects.search(
          keyStringQuery,
          null,
          this.openmct.objects.SEARCH_TYPES.ANNOTATIONS
        )
      )
    ).flat();

    return searchResults;
  }

  /**
   * @method deleteAnnotations
   * @param {DomainObject[]} existingAnnotation - An array of annotations to delete (set _deleted to true)
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
   * @method deleteAnnotations
   * @param {DomainObject} annotation - An annotation to undelete (set _deleted to false)
   */
  unDeleteAnnotation(annotation) {
    if (!annotation) {
      throw new Error('Asked to undelete null annotation! 🙅‍♂️');
    }

    this.openmct.objects.mutate(annotation, '_deleted', false);
  }

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

  #addTagMetaInformationToTags(tags) {
    return tags.map((tagKey) => {
      const tagModel = this.availableTags[tagKey];
      tagModel.tagID = tagKey;

      return tagModel;
    });
  }

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

  async #addTargetModelsToResults(results) {
    const modelAddedToResults = await Promise.all(
      results.map(async (result) => {
        const targetModels = await Promise.all(
          Object.keys(result.targets).map(async (targetID) => {
            const targetModel = await this.openmct.objects.get(targetID);
            const targetKeyString = this.openmct.objects.makeKeyString(targetModel.identifier);
            const originalPathObjects = await this.openmct.objects.getOriginalPath(targetKeyString);

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

  #combineSameTargets(results) {
    const combinedResults = [];
    results.forEach((currentAnnotation) => {
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
   * @method #breakApartSeparateTargets
   * @param {Array} results A set of search results that could have the multiple targets for the same result
   * @returns {Array} The same set of results, but with each target separated out into its own result
   */
  #breakApartSeparateTargets(results) {
    const separateResults = [];
    results.forEach((result) => {
      Object.keys(result.targets).forEach((targetID) => {
        const separatedResult = {
          ...result
        };
        separatedResult.targets = {
          [targetID]: result.targets[targetID]
        };
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
   * @method searchForTags
   * @param {String} query A query to match against tags. E.g., "dr" will match the tags "drilling" and "driving"
   * @param {Object} [abortController] An optional abort method to stop the query
   * @returns {Promise} returns a model of matching tags with their target domain objects attached
   */
  async searchForTags(query, abortController) {
    const matchingTagKeys = this.#getMatchingTags(query);
    if (!matchingTagKeys.length) {
      return [];
    }

    const searchResults = (
      await Promise.all(
        this.openmct.objects.search(
          matchingTagKeys,
          abortController,
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
    const appliedTargetsModels = await this.#addTargetModelsToResults(appliedTagSearchResults);
    const resultsWithValidPath = appliedTargetsModels.filter((result) => {
      return this.openmct.objects.isReachable(result.targetModels?.[0]?.originalPath);
    });
    const breakApartSeparateTargets = this.#breakApartSeparateTargets(resultsWithValidPath);

    return breakApartSeparateTargets;
  }
}
