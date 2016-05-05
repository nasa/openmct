/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

define(
    [
        "zepto"
    ],
    function ($) {
        "use strict";

        function DemoConductorRepresenter(
            $q,
            views,
            scope,
            element
        ) {
            this.$q = $q;
            this.scope = scope;
            this.element = element;
            this.views = views;
        }

        function fastPromise(value) {
            return {
                then: function (callback) {
                    return fastPromise(callback(value));
                }
            }
        }

        function and(array) {
            return array.reduce(function (previous, next) {
                return previous && next;
            }, true);
        }

        /**
         * Test whether the given object OR all of its descendants have the
         * conductor enabled
         * @param object
         * @returns {*}
         */
        DemoConductorRepresenter.prototype.showConductor = function (object) {
            var self = this;

            //Does the object itself allow the time conductor?
            if (object.getModel().showConductor) {
                return fastPromise(object.getModel().showConductor);
            } else {
                //If not, do all of its constituents allow time conductor?
                if (object.hasCapability('composition')) {
                    return object.useCapability('composition').then(function (composition) {
                        return self.$q.all(composition.map(self.showConductor.bind(self))).then(and);
                    });
                } else {
                    //if no, hide time conductor
                    return fastPromise(false);
                }
            }
        }

        /**
         * @param representation
         * @param representedObject
         */
        DemoConductorRepresenter.prototype.represent = function (representation, representedObject) {
            if (this.views.indexOf(representation) !== -1) {
                this.showConductor(representedObject).then(function (show) {
                    if (!show || representation.type === 'folder') {
                        $('.l-time-controller').hide();
                    }
                });
            }
        };

        DemoConductorRepresenter.prototype.destroy = function destroy() {

        };

        return DemoConductorRepresenter;
    });
