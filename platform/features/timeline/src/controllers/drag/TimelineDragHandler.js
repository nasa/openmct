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
         * Handles business logic (mutation of objects, retrieval of start/end
         * times) associated with drag gestures to manipulate start/end times
         * of activities and timelines in a Timeline view.
         * @constructor
         * @param {DomainObject} domainObject the object being viewed
         * @param {ObjectLoader} objectLoader service to assist in loading
         *        subtrees
         */
        function TimelineDragHandler(domainObject, objectLoader) {
            var timespans = {},
                persists = {},
                mutations = {},
                compositions = {},
                dirty = {};

            // "Cast" a domainObject to an id, if necessary
            function toId(value) {
                return (typeof value !== 'string' && value.getId) ?
                        value.getId() : value;
            }

            // Get the timespan associated with this domain object
            function populateCapabilityMaps(domainObject) {
                var id = domainObject.getId(),
                    timespanPromise = domainObject.useCapability('timespan');
                if (timespanPromise) {
                    timespanPromise.then(function (timespan) {
                        // Cache that timespan
                        timespans[id] = timespan;
                        // And its mutation capability
                        mutations[id] = domainObject.getCapability('mutation');
                        // Also cache the persistence capability for later
                        persists[id] = domainObject.getCapability('persistence');
                        // And the composition, for bulk moves
                        compositions[id] = domainObject.getModel().composition || [];
                    });
                }
            }

            // Populate the id->timespan map
            function populateTimespans(subgraph) {
                populateCapabilityMaps(subgraph.domainObject);
                subgraph.composition.forEach(populateTimespans);
            }

            // Persist changes for objects by id (when dragging ends)
            function doPersist(id) {
                var persistence = persists[id],
                    mutation = mutations[id];
                if (mutation) {
                    // Mutate just to update the timestamp (since we
                    // explicitly don't do this during the drag to
                    // avoid firing a ton of refreshes.)
                    mutation.mutate(function () {});
                }
                if (persistence) {
                    // Persist the changes
                    persistence.persist();
                }
            }

            // Use the object loader to get objects which have timespans
            objectLoader.load(domainObject, 'timespan').then(populateTimespans);

            return {
                /**
                 * Get a list of identifiers for domain objects which have
                 * timespans that are managed here.
                 * @returns {string[]} ids for all objects which have managed
                 *          timespans here
                 */
                ids: function () {
                    return Object.keys(timespans).sort();
                },
                /**
                 * Persist any changes to timespans that have been made through
                 * this handler.
                 */
                persist: function () {
                    // Persist every dirty object...
                    Object.keys(dirty).forEach(doPersist);
                    // Clear out the dirty list
                    dirty = {};
                },
                /**
                 * Get the start time for a specific domain object. The domain
                 * object may be specified by its identifier, or passed as a
                 * domain object instance. If a second, numeric argument is
                 * passed, this functions as a setter.
                 * @returns {number} the start time
                 * @param {string|DomainObject} id the domain object to modify
                 * @param {number} [value] the new value
                 */
                start: function (id, value) {
                    // Convert to domain object id, look up timespan
                    var timespan = timespans[toId(id)];
                    // Use as setter if argument is present
                    if ((typeof value === 'number') && timespan) {
                        // Set the start (ensuring that it's non-negative,
                        // and not after the end time.)
                        timespan.setStart(
                            Math.min(Math.max(value, 0), timespan.getEnd())
                        );
                        // Mark as dirty for subsequent persistence
                        dirty[toId(id)] = true;
                    }
                    // Return value from the timespan
                    return timespan && timespan.getStart();
                },
                /**
                 * Get the end time for a specific domain object. The domain
                 * object may be specified by its identifier, or passed as a
                 * domain object instance. If a second, numeric argument is
                 * passed, this functions as a setter.
                 * @returns {number} the end time
                 * @param {string|DomainObject} id the domain object to modify
                 * @param {number} [value] the new value
                 */
                end: function (id, value) {
                    // Convert to domain object id, look up timespan
                    var timespan = timespans[toId(id)];
                    // Use as setter if argument is present
                    if ((typeof value === 'number') && timespan) {
                        // Set the end (ensuring it doesn't preceed start)
                        timespan.setEnd(
                            Math.max(value, timespan.getStart())
                        );
                        // Mark as dirty for subsequent persistence
                        dirty[toId(id)] = true;
                    }
                    // Return value from the timespan
                    return timespan && timespan.getEnd();
                },
                /**
                 * Get the duration for a specific domain object. The domain
                 * object may be specified by its identifier, or passed as a
                 * domain object instance. If a second, numeric argument is
                 * passed, this functions as a setter.
                 * @returns {number} the duration
                 * @param {string|DomainObject} id the domain object to modify
                 * @param {number} [value] the new value
                 */
                duration: function (id, value) {
                    // Convert to domain object id, look up timespan
                    var timespan = timespans[toId(id)];
                    // Use as setter if argument is present
                    if ((typeof value === 'number') && timespan) {
                        // Set duration (ensure that it's non-negative)
                        timespan.setDuration(
                            Math.max(value, 0)
                        );
                        // Mark as dirty for subsequent persistence
                        dirty[toId(id)] = true;
                    }
                    // Return value from the timespan
                    return timespan && timespan.getDuration();
                },
                /**
                 * Move the start and end of this domain object by the
                 * specified delta. Contained objects will move as well.
                 * @param {string|DomainObject} id the domain object to modify
                 * @param {number} delta the amount by which to change
                 */
                move: function (id, delta) {
                    // Overview of algorithm used here:
                    // - Build up list of ids to actually move
                    // - Find the minimum start time
                    // - Change delta so it cannot move minimum past 0
                    // - Update start, then end time
                    var ids = {},
                        queue = [toId(id)],
                        minStart;

                    // Update start & end, in that order
                    function updateStartEnd(id) {
                        var timespan = timespans[id], start, end;
                        if (timespan) {
                            // Get start/end so we don't get fooled by our
                            // own adjustments
                            start = timespan.getStart();
                            end = timespan.getEnd();
                            // Update start, then end
                            timespan.setStart(start + delta);
                            timespan.setEnd(end + delta);
                            // Mark as dirty for subsequent persistence
                            dirty[toId(id)] = true;
                        }
                    }

                    // Build up set of ids
                    while (queue.length > 0) {
                        // Get the next id to consider
                        id = queue.shift();
                        // If we haven't already considered this...
                        if (!ids[id]) {
                            // Add it to the set
                            ids[id] = true;
                            // And queue up its composition
                            queue = queue.concat(compositions[id] || []);
                        }
                    }

                    // Find the minimum start time
                    minStart = Object.keys(ids).map(function (id) {
                        // Get the start time; default to +Inf if not
                        // found, since this will not survive a min
                        // test if any real timespans are present
                        return timespans[id] ?
                                timespans[id].getStart() :
                                Number.POSITIVE_INFINITY;
                    }).reduce(function (a, b) {
                        // Reduce with a minimum test
                        return Math.min(a, b);
                    }, Number.POSITIVE_INFINITY);

                    // Ensure delta doesn't exceed bounds
                    delta = Math.max(delta, -minStart);

                    // Update start/end times
                    if (delta !== 0) {
                        Object.keys(ids).forEach(updateStartEnd);
                    }
                }
            };
        }

        return TimelineDragHandler;
    }
);