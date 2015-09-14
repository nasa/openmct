/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Provides data to populate resource graphs associated
         * with timelines in a timeline view.
         * This is a placeholder until WTD-918.
         * @constructor
         */
        function TimelineUtilization() {
            return {
                getPointCount: function () {
                    return 1000;
                },
                getDomainValue: function (index) {
                    return 60000 * index;
                },
                getRangeValue: function (index) {
                    return Math.sin(index) * (index % 10);
                }
            };
        }

        return TimelineUtilization;
    }

);