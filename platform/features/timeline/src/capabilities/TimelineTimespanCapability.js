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
    ['./TimelineTimespan'],
    function (TimelineTimespan) {
        'use strict';

        /**
         * Implements the `timespan` capability for Timeline objects.
         *
         * @constructor
         * @param $q Angular's $q, for promise-handling
         * @param {DomainObject} domainObject the Timeline
         */
        function TimelineTimespanCapability($q, domainObject) {
            // Check if a capability is defin

            // Look up a child object's time span
            function lookupTimeSpan(childObject) {
                return childObject.useCapability('timespan');
            }

            // Check if a child object exposes a time span
            function hasTimeSpan(childObject) {
                return childObject.hasCapability('timespan');
            }

            // Instantiate a time span bounding other time spans
            function giveTimeSpan(timespans) {
                return new TimelineTimespan(
                    domainObject.getModel(),
                    domainObject.getCapability('mutation'),
                    timespans
                );
            }

            // Build a time span object that fits all children
            function buildTimeSpan(childObjects) {
                return $q.all(
                    childObjects.filter(hasTimeSpan).map(lookupTimeSpan)
                ).then(giveTimeSpan);
            }

            // Promise
            function promiseTimeSpan() {
                return domainObject.useCapability('composition')
                    .then(buildTimeSpan);
            }

            return {
                /**
                 * Get the time span (start, end, duration) of this timeline.
                 * @returns {Promise.<TimelineTimespan>} the time span of
                 *          this timeline
                 */
                invoke: promiseTimeSpan
            };
        }

        // Only applies to timeline objects
        TimelineTimespanCapability.appliesTo = function (model) {
            return model && (model.type === 'timeline');
        };

        return TimelineTimespanCapability;

    }
);
