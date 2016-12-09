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
], function (
    _
) {

    function valueMetadatasFromOldFormat(metadata) {
        var valueMetadatas = [];

        metadata.domains.forEach(function (domain, index) {
            var valueMetadata = _.clone(domain);
            valueMetadata.hints = {
                x: index,
                domain: index
            };
            valueMetadatas.push(valueMetadata);
        });

        metadata.ranges.forEach(function (range, index) {
            var valueMetadata = _.clone(range);
            valueMetadata.hints = {
                y: index,
                range: index,
                priority: index + metadata.domains.length
            };

            if (valueMetadata.type === 'enum') {
                valueMetadata.key = 'enum';
                valueMetadata.hints.y -= 10;
                valueMetadata.hints.range -= 10;
                valueMetadata.enumerations =
                    _.sortBy(valueMetadata.enumerations.map(function (e) {
                        return {
                            string: e.string,
                            value: +e.value
                        };
                    }), 'e.value');
                valueMetadata.values = _.pluck(valueMetadata.enumerations, 'value');
                valueMetadata.max = _.max(valueMetadata.values);
                valueMetadata.min = _.min(valueMetadata.values);
            };

            valueMetadatas.push(valueMetadata);
        });

        return valueMetadatas;
    }

    function applyReasonableDefaults(valueMetadata, index) {
        valueMetadata.source = valueMetadata.source || valueMetadata.key;
        valueMetadata.hints = valueMetadata.hints || {};

        if (!valueMetadata.hints.hasOwnProperty('priority')) {
            valueMetadata.hints.priority = index;
        }
        return valueMetadata;
    }

    /**
     * Utility class for handling telemetry metadata for a domain object.
     * Wraps old format metadata to new format metadata.
     * Provides methods for interrogating telemetry metadata.
     */
    function TelemetryMetadataManager(domainObject, typeService) {
        this.metadata = domainObject.telemetry || {};

        if (this.metadata.values) {
            this.valueMetadatas = this.metadata.values;
        } else {
            var typeMetadata = typeService
                .getType(domainObject.type).typeDef.telemetry;

            _.extend(this.metadata, typeMetadata);
            this.valueMetadatas = valueMetadatasFromOldFormat(this.metadata);
        }

        this.valueMetadatas = this.valueMetadatas.map(applyReasonableDefaults);
    }


    /**
     * Get value metadata for a single key.
     */
    TelemetryMetadataManager.prototype.value = function (key) {
        return this.valueMetadatas.filter(function (metadata) {
            return metadata.key === key
        })[0];
    };

    /**
     * Returns all value metadatas, sorted by priority.
     */
    TelemetryMetadataManager.prototype.values = function () {
        return this.valuesForHints(['priority']);
    };

    /**
     * Get an array of valueMetadatas that posess all hints requested.
     * Array is sorted based on hint priority.
     *
     */
    TelemetryMetadataManager.prototype.valuesForHints = function (
        hints
    ) {
        function hasHint(hint) {
            return this.hints.hasOwnProperty(hint);
        }
        function hasHints(metadata) {
            return hints.every(hasHint, metadata);
        }
        var matchingMetadata = this.valueMetadatas.filter(hasHints);
        var sortedMetadata = _.sortBy(matchingMetadata, function (metadata) {
            return hints.map(function (hint) {
                return metadata.hints[hint];
            });
        });
        return sortedMetadata;
    };


    return TelemetryMetadataManager;

});
