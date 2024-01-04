/*****************************************************************************
 * Open openmct, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open openmct is licensed under the Apache License, Version 2.0 (the
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
 * Open openmct includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/**
 * Default metadata provider class. This provider returns telemetry metadata
 * from domain objects and implements legacy support for telemetry metadata
 * defined on the type.
 */
class DefaultMetadataProvider {
  /**
   * Creates an instance of DefaultMetadataProvider.
   * @param {Object} openmct - The Open MCT instance.
   */
  constructor(openmct) {
    this.openmct = openmct;
  }

  /**
   * Checks if the domain object supports metadata.
   * @param {Object} domainObject - The domain object to check.
   * @returns {boolean} True if the domain object supports metadata.
   */
  supportsMetadata(domainObject) {
    return Boolean(domainObject.telemetry) || Boolean(this.typeHasTelemetry(domainObject));
  }

  /**
   * Retrieves telemetry metadata for a given domain object.
   * @param {Object} domainObject - The domain object to get metadata from.
   * @returns {Object} The telemetry metadata.
   */
  getMetadata(domainObject) {
    const metadata = domainObject.telemetry || {};
    if (this.typeHasTelemetry(domainObject)) {
      const typeMetadata = this.openmct.types.get(domainObject.type).definition.telemetry;
      Object.assign(metadata, typeMetadata);

      if (!metadata.values) {
        metadata.values = DefaultMetadataProvider.valueMetadatasFromOldFormat(metadata);
      }
    }
    return metadata;
  }

  /**
   * Checks if the domain object type has telemetry.
   * @private
   * @param {Object} domainObject - The domain object to check.
   * @returns {boolean} True if the domain object type has telemetry.
   */
  typeHasTelemetry(domainObject) {
    const type = this.openmct.types.get(domainObject.type);
    return Boolean(type.definition.telemetry);
  }

  /**
   * Converts legacy metadata format to value metadata.
   * @private
   * @param {Object} metadata - The legacy metadata.
   * @returns {Array} The value metadata array.
   */
  static valueMetadatasFromOldFormat(metadata) {
    const valueMetadatas = [];

    valueMetadatas.push({
      key: 'name',
      name: 'Name'
    });

    metadata.domains.forEach((domain, index) => {
      const valueMetadata = _.clone(domain);
      valueMetadata.hints = {
        domain: index + 1
      };
      valueMetadatas.push(valueMetadata);
    });

    metadata.ranges.forEach((range, index) => {
      const valueMetadata = _.clone(range);
      valueMetadata.hints = {
        range: index,
        priority: index + metadata.domains.length + 1
      };

      if (valueMetadata.type === 'enum') {
        // Additional processing for enum type
        valueMetadata.key = 'enum';
        valueMetadata.hints.y -= 10;
        valueMetadata.hints.range -= 10;
        valueMetadata.enumerations = _.sortBy(
          valueMetadata.enumerations.map((e) => ({
            string: e.string,
            value: Number(e.value)
          })),
          'e.value'
        );
        valueMetadata.values = valueMetadata.enumerations.map((e) => e.value);
        valueMetadata.max = Math.max.apply(null, valueMetadata.values);
        valueMetadata.min = Math.min.apply(null, valueMetadata.values);
      }

      valueMetadatas.push(valueMetadata);
    });

    return valueMetadatas;
  }
}

export default DefaultMetadataProvider;
