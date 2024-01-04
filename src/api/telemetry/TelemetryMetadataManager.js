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

import _ from 'lodash';

/**
 * Applies reasonable defaults to the value metadata.
 * @param {Object} valueMetadata - The value metadata object.
 * @param {number} index - The index of the value metadata.
 * @returns {Object} - The updated value metadata object.
 */
function applyReasonableDefaults(valueMetadata, index) {
  valueMetadata.source = valueMetadata.source || valueMetadata.key;
  valueMetadata.hints = valueMetadata.hints || {};

  if (Object.prototype.hasOwnProperty.call(valueMetadata.hints, 'x')) {
    if (!Object.prototype.hasOwnProperty.call(valueMetadata.hints, 'domain')) {
      valueMetadata.hints.domain = valueMetadata.hints.x;
    }

    delete valueMetadata.hints.x;
  }

  if (Object.prototype.hasOwnProperty.call(valueMetadata.hints, 'y')) {
    if (!Object.prototype.hasOwnProperty.call(valueMetadata.hints, 'range')) {
      valueMetadata.hints.range = valueMetadata.hints.y;
    }

    delete valueMetadata.hints.y;
  }

  if (valueMetadata.format === 'enum') {
    if (!valueMetadata.values) {
      valueMetadata.values = valueMetadata.enumerations.map((e) => e.value);
    }

    if (!Object.prototype.hasOwnProperty.call(valueMetadata, 'max')) {
      valueMetadata.max = Math.max(...valueMetadata.values) + 1;
    }

    if (!Object.prototype.hasOwnProperty.call(valueMetadata, 'min')) {
      valueMetadata.min = Math.min(...valueMetadata.values) - 1;
    }
  }

  if (!Object.prototype.hasOwnProperty.call(valueMetadata.hints, 'priority')) {
    valueMetadata.hints.priority = index;
  }

  return valueMetadata;
}

/**
 * Utility class for handling and inspecting telemetry metadata.  Applies
 * reasonable defaults to simplify the task of providing metadata, while
 * also providing methods for interrogating telemetry metadata.
 */
class TelemetryMetadataManager {
  /**
   * Creates an instance of TelemetryMetadataManager.
   * @param {Object} metadata - The telemetry metadata object.
   */
  constructor(metadata) {
    this.metadata = metadata;

    this.valueMetadatas = this.metadata.values
      ? this.metadata.values.map(applyReasonableDefaults)
      : [];
  }

  /**
   * Get value metadata for a single key.
   * @param {string} key - The key of the value metadata.
   * @returns {Object} - The value metadata object.
   */
  value(key) {
    return this.valueMetadatas.find((metadata) => metadata.key === key);
  }

  /**
   * Returns all value metadatas, sorted by priority.
   * @returns {Array} - The array of value metadata objects.
   */
  values() {
    return this.valuesForHints(['priority']);
  }

  /**
   * Get an array of valueMetadatas that possess all hints requested.
   * Array is sorted based on hint priority.
   * @param {Array} hints - The array of hints.
   * @returns {Array} - The array of matching value metadata objects.
   */
  valuesForHints(hints) {
    const hasHint = function (hint) {
      return Object.prototype.hasOwnProperty.call(this.hints, hint);
    }.bind(this);

    function hasHints(metadata) {
      return hints.every(hasHint, metadata);
    }

    const matchingMetadata = this.valueMetadatas.filter(hasHints);
    const iteratees = hints.map((hint) => (metadata) => metadata.hints[hint]);

    return _.sortBy(matchingMetadata, ...iteratees);
  }

  /**
   * Check if a given metadata has array values.
   * @param {Object} metadata - The metadata object.
   * @returns {boolean} - True if the metadata has array values, false otherwise.
   */
  isArrayValue(metadata) {
    const regex = /\[\]$/g;
    if (!metadata.format && !metadata.formatString) {
      return false;
    }

    return (metadata.format || metadata.formatString).match(regex) !== null;
  }

  /**
   * Get the filterable value metadatas.
   * @returns {Array} - The array of filterable value metadata objects.
   */
  getFilterableValues() {
    return this.valueMetadatas.filter(
      (metadatum) => metadatum.filters && metadatum.filters.length > 0
    );
  }

  /**
   * Get the value metadata that can be updated in place.
   * @returns {Object} - The value metadata object.
   */
  getUseToUpdateInPlaceValue() {
    return this.valueMetadatas.find(this.isInPlaceUpdateValue);
  }

  /**
   * Check if a given value metadata can be updated in place.
   * @param {Object} metadatum - The value metadata object.
   * @returns {boolean} - True if the value metadata can be updated in place, false otherwise.
   */
  isInPlaceUpdateValue(metadatum) {
    return metadatum.useToUpdateInPlace === true;
  }

  /**
   * Get the default display value metadata.
   * @returns {Object} - The default display value metadata object.
   */
  getDefaultDisplayValue() {
    let valueMetadata = this.valuesForHints(['range'])[0];

    if (valueMetadata === undefined) {
      valueMetadata = this.values().find((values) => !values.hints.domain);
    }

    if (valueMetadata === undefined) {
      valueMetadata = this.values()[0];
    }

    return valueMetadata;
  }
}

export default TelemetryMetadataManager;
