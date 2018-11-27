/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

define(
    ['./ViewConfiguration'],
    function (ViewConfiguration) {

        class TelemetryViewConfiguration extends ViewConfiguration {
            static create(domainObject, position, openmct) {
                const DEFAULT_TELEMETRY_DIMENSIONS = [2, 1];

                function getDefaultTelemetryValue(domainObject, openmct) {
                    let metadata = openmct.telemetry.getMetadata(domainObject);
                    let valueMetadata = metadata.valuesForHints(['range'])[0];

                    if (valueMetadata === undefined) {
                        valueMetadata = metadata.values().filter(values => {
                            return !(values.hints.domain);
                        })[0];
                    }

                    if (valueMetadata === undefined) {
                        valueMetadata = metadata.values()[0];
                    }

                    return valueMetadata.key;
                }

                // Apply defaults then construct and return object
                let alphanumeric = {
                    identifier: domainObject.identifier,
                    position: position,
                    dimensions: DEFAULT_TELEMETRY_DIMENSIONS,
                    displayMode: 'all',
                    value: getDefaultTelemetryValue(domainObject, openmct),
                    stroke: "transparent",
                    fill: "",
                    color: "",
                    size: "13px",
                };

                return alphanumeric;
            }

            /**
             * @param {Object} configuration the telemetry object view configuration
             * @param {Object} configuration.alphanumeric
             * @param {Object} configuration.domainObject the domain object to observe the changes on
             * @param {Object} configuration.rawPosition an object that holds raw position and dimensions
             * @param {Object} configuration.openmct the openmct object
             */
            constructor({alphanumeric, ...rest}) {
                rest.rawPosition = {
                    position: alphanumeric.position,
                    dimensions: alphanumeric.dimensions
                };
                super(rest);
                this.alphanumeric = alphanumeric;
            }

            path() {
                return "configuration.alphanumerics[" + this.alphanumeric.index + "]";
            }

            observeProperties() {
                [
                    'displayMode',
                    'value',
                    'fill',
                    'stroke',
                    'color',
                    'size'
                ].forEach(property => {
                    this.attachListener(property, newValue => {
                        this.alphanumeric[property] = newValue;
                    });
                });
            }
        }

        return TelemetryViewConfiguration;
    }
);
