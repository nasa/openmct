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
        class ViewConfiguration {

            constructor({domainObject, openmct, gridSize}) {
                this.domainObject = domainObject;
                this.gridSize = gridSize;
                this.mutatePosition = this.mutatePosition.bind(this);
                this.listeners = [];
                this.observe = openmct.objects.observe.bind(openmct.objects);
                this.mutate = function (path, value) {
                    openmct.objects.mutate(this.domainObject, path, value);
                }.bind(this);
                this.newPosition = {};
            }

            mutatePosition() {
                this.mutate(this.path() + ".x", this.newPosition.position[0]);
                this.mutate(this.path() + ".y", this.newPosition.position[1]);
                this.mutate(this.path() + ".width", this.newPosition.dimensions[0]);
                this.mutate(this.path() + ".height", this.newPosition.dimensions[1]);
            }

            attachListener(property, callback) {
                this.listeners.push(this.observe(this.domainObject, this.path() + "." + property, callback));
            }

            attachListeners() {
                this.observeProperties();
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

            position() {
                return {
                    position: [this.x(), this.y()],
                    dimensions: [this.width(), this.height()]
                };
            }

            path() {
                throw "NOT IMPLEMENTED;"
            }

            inspectable() {
                return true;
            }

            updateStyle(raw) {
                if (!raw) {
                    raw = this.position();
                }

                this.style = {
                    left: (this.gridSize[0] * raw.position[0]) + 'px',
                    top: (this.gridSize[1] * raw.position[1]) + 'px',
                    width: (this.gridSize[0] * raw.dimensions[0]) + 'px',
                    height: (this.gridSize[1] * raw.dimensions[1]) + 'px',
                    minWidth: (this.gridSize[0] * raw.dimensions[0]) + 'px',
                    minHeight: (this.gridSize[1] * raw.dimensions[1]) + 'px'
                };
            }

            observeProperties() {
                // Not implemented
            }

            x() {
                // Not implemented
            }

            y() {
                // Not implemented
            }

            width() {
                // Not implemented
            }

            height() {
                // Not implemented
            }

            hasFrame() {
                // Not implemented
            }
        }

        return ViewConfiguration;
    }
 );