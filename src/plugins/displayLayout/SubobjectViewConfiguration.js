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
        class SubobjectViewConfiguration extends ViewConfiguration {

            /**
             *
             * @param {Object} configuration the subobject view configuration
             * @param {String} configuration.id the domain object keystring identifier
             * @param {Boolean} configuration.panel
             * @param {Object} configuration.domainObject the domain object to observe the changes on
             * @param {Object} configuration.openmct the openmct object
             */
            constructor({panel, id, ...rest}) {
                super(rest);
                this.id = id;
                this.panel = panel;
                this.hasFrame = this.hasFrame.bind(this);
                this.updateStyle(this.position());
            }

            path() {
                return "configuration.panels[" + this.id + "]";
            }

            x() {
                return this.panel.x;
            }

            y() {
                return this.panel.y;
            }

            width() {
                return this.panel.width;
            }

            height() {
                return this.panel.height;
            }

            hasFrame() {
                return this.panel.hasFrame;
            }

            observeProperties() {
                [
                    'hasFrame',
                    'x',
                    'y',
                    'width',
                    'height'
                ].forEach(property => {
                    this.attachListener(property, newValue => {
                        this.panel[property] = newValue;

                        if (property === 'width' || property === 'height' ||
                            property === 'x' || property === 'y') {
                            this.updateStyle();
                        }
                    });
                });
            }
        }

        return SubobjectViewConfiguration;
    }
);
