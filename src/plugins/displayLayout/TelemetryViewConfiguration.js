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

define([],
    function () {
        class TelemetryViewConfiguration {
            /**
             *
             * @param domainObject the domain object to mutate.
             * @param alphanumeric
             * @param rawPosition
             * @param openmct
             */
            constructor(domainObject, alphanumeric, rawPosition, openmct) {
                this.domainObject = domainObject;
                this.alphanumeric = alphanumeric;
                this.rawPosition = rawPosition;
                this.observe = openmct.objects.observe.bind(openmct.objects);
                this.mutate = function (path, value) {
                    openmct.objects.mutate(this.domainObject, path, value);
                }.bind(this);
                this.mutatePosition = this.mutatePosition.bind(this);
                this.listeners = [];
            }

            mutatePosition() {
                let path = "configuration.alphanumerics[" + this.alphanumeric.index + "]";
                this.mutate(path + ".dimensions", this.rawPosition.dimensions);
                this.mutate(path + ".position", this.rawPosition.position);
            }

            attachListeners() {
                let path = "configuration.alphanumerics[" + this.alphanumeric.index + "]";
                [
                    'displayMode',
                    'value',
                    'fill',
                    'stroke',
                    'color',
                    'size'
                ].forEach(property => {
                    this.listeners.push(
                        this.observe(this.domainObject, path + "." + property, function (newValue) {
                            this.alphanumeric[property] = newValue;
                        }.bind(this))
                    );
                });
                this.listeners.push(this.observe(this.domainObject, '*', function (obj) {
                    this.domainObject = JSON.parse(JSON.stringify(obj));
                }.bind(this)));
            }

            removeListeners() {
                this.listeners.forEach(listener => {
                    listener();
                });
                this.listeners = [];
            }

        }

        return TelemetryViewConfiguration;
    }
);
