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
            return model && (model.type === 'warp.timeline');
        };

        return TimelineTimespanCapability;

    }
);