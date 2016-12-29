/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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


define([
    'lodash'
], (_) => {

    const valueMetadatasFromOldFormat = (metadata) => {
        let valueMetadatas = [];

        valueMetadatas.push({
            key: 'name',
            name: 'Name'
        });

        metadata.domains.forEach( (domain, index) => {
            let valueMetadata = _.clone(domain);
            valueMetadata.hints = {
                x: index + 1,
                domain: index + 1
            };
            valueMetadatas.push(valueMetadata);
        });

        metadata.ranges.forEach( (range, index) => {
            let valueMetadata = _.clone(range);
            valueMetadata.hints = {
                y: index,
                range: index,
                priority: index + metadata.domains.length + 1
            };

            if (valueMetadata.type === 'enum') {
                valueMetadata.key = 'enum';
                valueMetadata.hints.y -= 10;
                valueMetadata.hints.range -= 10;
                valueMetadata.enumerations =
                    _.sortBy(valueMetadata.enumerations.map( (e) => {
                        return {
                            string: e.string,
                            value: +e.value
                        };
                    }), 'e.value');
                valueMetadata.values = _.pluck(valueMetadata.enumerations, 'value');
                valueMetadata.max = _.max(valueMetadata.values);
                valueMetadata.min = _.min(valueMetadata.values);
            }

            valueMetadatas.push(valueMetadata);
        });

        return valueMetadatas;
    };

    const applyReasonableDefaults = (valueMetadata, index) => {
        valueMetadata.source = valueMetadata.source || valueMetadata.key;
        valueMetadata.hints = valueMetadata.hints || {};

        if (!valueMetadata.hints.hasOwnProperty('priority')) {
            valueMetadata.hints.priority = index;
        }
        return valueMetadata;
    };

    /**
     * Utility class for handling telemetry metadata for a domain object.
     * Wraps old format metadata to new format metadata.
     * Provides methods for interrogating telemetry metadata.
     */
    class TelemetryMetadataManager {
      constructor(domainObject, typeService) {
        this.metadata = domainObject.telemetry || {};

        if (this.metadata.values) {
            this.valueMetadatas = this.metadata.values;
        } else {
            let typeMetadata = typeService
                .getType(domainObject.type).typeDef.telemetry;

            _.extend(this.metadata, typeMetadata);
            this.valueMetadatas = valueMetadatasFromOldFormat(this.metadata);
        }

        this.valueMetadatas = this.valueMetadatas.map(applyReasonableDefaults);
    }


    /**
     * Get value metadata for a single key.
     */
    value(key) {
        return this.valueMetadatas.filter( (metadata) => {
            return metadata.key === key;
        })[0];
    }

    /**
     * Returns all value metadatas, sorted by priority.
     */
    values() {
        return this.valuesForHints(['priority']);
    }

    /**
     * Get an array of valueMetadatas that posess all hints requested.
     * Array is sorted based on hint priority.
     *
     */
    valuesForHints(hints) {
        const hasHint = (hint) => {
            /*jshint validthis: true */
            return this.hints.hasOwnProperty(hint);
        };
        const hasHints = (metadata) => {
            return hints.every(hasHint, metadata);
        };
        let matchingMetadata = this.valueMetadatas.filter(hasHints);
        let sortedMetadata = _.sortBy(matchingMetadata, (metadata) => {
            return hints.map( (hint) => {
                return metadata.hints[hint];
            });
        });
        return sortedMetadata;
    }
}
return TelemetryMetadataManager;
});
