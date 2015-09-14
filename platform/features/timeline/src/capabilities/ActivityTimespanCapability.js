/*global define*/

define(
    ['./ActivityTimespan'],
    function (ActivityTimespan) {
        'use strict';

        /**
         * Implements the `warp.timespan` capability for Activity objects.
         *
         * @constructor
         * @param $q Angular's $q, for promise-handling
         * @param {DomainObject} domainObject the Activity
         */
        function ActivityTimespanCapability($q, domainObject) {
            // Promise time span
            function promiseTimeSpan() {
                return $q.when(new ActivityTimespan(
                    domainObject.getModel(),
                    domainObject.getCapability('mutation')
                ));
            }

            return {
                /**
                 * Get the time span (start, end, duration) of this activity.
                 * @returns {Promise.<ActivityTimespan>} the time span of
                 *          this activity
                 */
                invoke: promiseTimeSpan
            };
        }

        // Only applies to timeline objects
        ActivityTimespanCapability.appliesTo = function (model) {
            return model && (model.type === 'warp.activity');
        };

        return ActivityTimespanCapability;

    }
);