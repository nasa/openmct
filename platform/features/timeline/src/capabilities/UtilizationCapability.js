/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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
    [],
    () => {

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
        const UtilizationCapability = ($q, domainObject) => {

            // Utility function for array reduction
            const concatenate = (a, b) => {
                return (a || []).concat(b || []);
            }

            // Check whether an element in an array looks unique (for below)
            const unique = (element, index, array) => {
                return (index === 0) || (array[index - 1] !== element);
            }

            // Utility function to ensure sorted array is all unique
            const uniquify = (array) => {
                return array.filter(unique);
            }

            // Utility function for sorting strings arrays
            const sort = (array) => {
                return array.sort();
            }

            // Combine into one big array
            const flatten = (arrayOfArrays) => {
                return arrayOfArrays.reduce(concatenate, []);
            }

            // Promise the objects contained by this timeline/activity
            const promiseComposition = () => {
                return $q.when(domainObject.useCapability('composition') || []);
            }

            // Promise all subsystem modes associated with this object
            const promiseModes = () => {
                let relationship = domainObject.getCapability('relationship'),
                    modes = relationship && relationship.getRelatedObjects('modes');
                return $q.when(modes || []);
            }

            // Promise the utilization which results directly from this object
            const promiseInternalUtilization = () => {
                let utilizations = {};

                // Record the cost of a given activity mode
                const addUtilization = (mode) => {
                    let cost = mode.getCapability('cost');
                    if (cost) {
                        cost.resources().forEach( (k) => {
                            utilizations[k] = utilizations[k] || 0;
                            utilizations[k] += cost.cost(k);
                        });
                    }
                }

                // Record costs for these modes
                const addUtilizations = (modes) => {
                    modes.forEach(addUtilization);
                }

                // Look up start/end times for this object
                const lookupTimespan = () => {
                    return domainObject.useCapability('timespan');
                }

                // Provide the result
                const giveResult = (timespan) => {
                    // Convert to utilization objects
                    return Object.keys(utilizations).sort().map( (k) => {
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
            const lookupUtilization = (object) => {
                return object.useCapability('utilization');
            }

            // Look up a specific object's resource utilization keys
            const lookupUtilizationResources = (object) => {
                let utilization = object.getCapability('utilization');
                return utilization && utilization.resources();
            }

            // Promise a consolidated list of resource utilizations
            const mapUtilization = (objects) => {
                return $q.all(objects.map(lookupUtilization))
                    .then(flatten);
            }

            // Promise a consolidated list of resource utilization keys
            const mapUtilizationResources = (objects) => {
                return $q.all(objects.map(lookupUtilizationResources))
                    .then(flatten);
            }

            // Promise utilization associated with contained objects
            const promiseExternalUtilization = () => {
                // Get the composition, then consolidate their utilizations
                return promiseComposition().then(mapUtilization);
            }

            // Get resource keys for this mode
            const getModeKeys = (mode) => {
                let cost = mode.getCapability('cost');
                return cost ? cost.resources() : [];
            }

            // Map the above (for use in below)
            const mapModeKeys = (modes) => {
                return modes.map(getModeKeys);
            }

            // Promise identifiers for resources associated with modes
            const promiseInternalKeys = () => {
                return promiseModes().then(mapModeKeys).then(flatten);
            }

            // Promise identifiers for resources associated with modes
            const promiseExternalKeys = () => {
                return promiseComposition().then(mapUtilizationResources);
            }

            // Promise identifiers for resources used
            const promiseResourceKeys = () => {
                return $q.all([
                    promiseInternalKeys(),
                    promiseExternalKeys()
                ]).then(flatten).then(sort).then(uniquify);
            }

            // Promise all utilization
            const promiseAllUtilization = () => {
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
                 * Get the resource utilization associated with this object
                 * directly, not including any resource utilization associated
                 * with contained objects.
                 * @returns {Promise.<Array>}
                 */
                internal: promiseInternalUtilization,
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
        UtilizationCapability.appliesTo = (model) => {
            return model &&
                ((model.type === 'timeline') ||
                        (model.type === 'activity'));
        };

        return UtilizationCapability;
    }
);
