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
    [],
    function () {
        "use strict";

        /**
         * A policy that will test whether a given object OR all of its
         * support historical telemetry
         */
        function ConductorPolicy($q) {
            this.$q = $q;
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

        function or(array) {
            return array.reduce(function (previous, next) {
                return previous || next;
            }, false);
        }

        /**
         * @param {DomainObject} candidate
         * @returns {Promise} a promise resolved with true if the object
         * supports historical telemetry
         */
        ConductorPolicy.prototype.allow = function (candidate) {
            var self = this;

            //Does the object itself allow the time conductor?
            if (candidate.hasCapability('telemetry') && candidate.getCapability('telemetry').getMetadata().historical) {
                return fastPromise(true);
            } else {
                //If not, do all of its constituents allow time conductor?
                if (candidate.hasCapability('composition')) {
                    return candidate.useCapability('composition').then(function (composition) {
                        if (composition.length === 0 ) {
                            return fastPromise(false);
                        } else {
                            return self.$q.all(composition.map(self.allow.bind(self))).then(or);
                        }
                    });
                } else {
                    //if no, hide time conductor
                    return fastPromise(false);
                }
            }
        };

        return ConductorPolicy;
    }
);