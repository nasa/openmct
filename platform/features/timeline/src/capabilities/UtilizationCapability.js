/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
         * Provide the resource utilization over time for a timeline
         * or activity object. A utilization is presented as an object
         * with four properties:
         * * `key`: The resource being utilized.
         * * `value`: The numeric utilization of that resource.
         * * `start`: The start time of the resource's utilization.
         * * `end`: The duration of this resource's utilization.
         * * `epoch`: The epoch to which `start` is relative.
         * @constructor
         */
        function UtilizationCapability($q, domainObject) {

            // Utility function for array reduction
            function concatenate(a, b) {
                return (a || []).concat(b || []);
            }

            // Check whether an element in an array looks unique (for below)
            function unique(element, index, array) {
                return (index === 0) || (array[index - 1] !== element);
            }

            // Utility function to ensure sorted array is all unique
            function uniquify(array) {
                return array.filter(unique);
            }

            // Utility function for sorting strings arrays
            function sort(array) {
                return array.sort();
            }

            // Combine into one big array
            function flatten(arrayOfArrays) {
                return arrayOfArrays.reduce(concatenate, []);
            }

            // Promise the objects contained by this timeline/activity
            function promiseComposition() {
                return $q.when(domainObject.useCapability('composition') || []);
            }

            // Promise all subsystem modes associated with this object
            function promiseModes() {
                var relationship = domainObject.getCapability('relationship'),
                    modes = relationship && relationship.getRelatedObjects('modes');
                return $q.when(modes || []);
            }

            // Promise the utilization which results directly from this object
            function promiseInternalUtilization() {
                var utilizations = {};

                // Record the cost of a given activity mode
                function addUtilization(mode) {
                    var cost = mode.getCapability('cost');
                    if (cost) {
                        cost.resources().forEach(function (k) {
                            utilizations[k] = utilizations[k] || 0;
                            utilizations[k] += cost.cost(k);
                        });
                    }
                }

                // Record costs for these modes
                function addUtilizations(modes) {
                    modes.forEach(addUtilization);
                }

                // Look up start/end times for this object
                function lookupTimespan() {
                    return domainObject.useCapability('timespan');
                }

                // Provide the result
                function giveResult(timespan) {
                    // Convert to utilization objects
                    return Object.keys(utilizations).sort().map(function (k) {
                        return {
                            key: k,
                            value: utilizations[k],
                            start: timespan.getStart(),
                            end: timespan.getEnd(),
                            epoch: timespan.getEpoch()
                        };
                    });
                }

                return promiseModes()
                    .then(addUtilizations)
                    .then(lookupTimespan)
                    .then(giveResult);
            }

            // Look up a specific object's resource utilization
            function lookupUtilization(domainObject) {
                return domainObject.useCapability('utilization');
            }

            // Look up a specific object's resource utilization keys
            function lookupUtilizationResources(domainObject) {
                var utilization = domainObject.getCapability('utilization');
                return utilization && utilization.resources();
            }

            // Promise a consolidated list of resource utilizations
            function mapUtilization(objects) {
                return $q.all(objects.map(lookupUtilization))
                    .then(flatten);
            }

            // Promise a consolidated list of resource utilization keys
            function mapUtilizationResources(objects) {
                return $q.all(objects.map(lookupUtilizationResources))
                    .then(flatten);
            }

            // Promise utilization associated with contained objects
            function promiseExternalUtilization() {
                // Get the composition, then consolidate their utilizations
                return promiseComposition().then(mapUtilization);
            }

            // Get resource keys for this mode
            function getModeKeys(mode) {
                var cost = mode.getCapability('cost');
                return cost ? cost.resources() : [];
            }

            // Map the above (for use in below)
            function mapModeKeys(modes) {
                return modes.map(getModeKeys);
            }

            // Promise identifiers for resources associated with modes
            function promiseInternalKeys() {
                return promiseModes().then(mapModeKeys).then(flatten);
            }

            // Promise identifiers for resources associated with modes
            function promiseExternalKeys() {
                return promiseComposition().then(mapUtilizationResources);
            }

            // Promise identifiers for resources used
            function promiseResourceKeys() {
                return $q.all([
                    promiseInternalKeys(),
                    promiseExternalKeys()
                ]).then(flatten).then(sort).then(uniquify);
            }

            // Promise all utilization
            function promiseAllUtilization() {
                // Concatenate internal utilization (from activity modes)
                // with external utilization (from subactivities)
                return $q.all([
                    promiseInternalUtilization(),
                    promiseExternalUtilization()
                ]).then(flatten);
            }

            return {
                /**
                 * Get the keys for resources associated with this object.
                 * @returns {Promise.<string[]>} a promise for resource identifiers
                 */
                resources: promiseResourceKeys,
                /**
                 * Get the resource utilization associated with this
                 * object. Results are not sorted. This requires looking
                 * at contained objects, which in turn must happen
                 * asynchronously, so this returns a promise.
                 * @returns {Promise.<Array>} a promise for all resource
                 *          utilizations
                 */
                invoke: promiseAllUtilization
            };
        }

        // Only applies to timelines and activities
        UtilizationCapability.appliesTo = function (model) {
            return model &&
                ((model.type === 'timeline') ||
                        (model.type === 'activity'));
        };

        return UtilizationCapability;
    }
);
