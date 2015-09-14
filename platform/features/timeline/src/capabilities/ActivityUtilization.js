/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Provides data to populate resource graphs associated
         * with activities in a timeline view.
         * This is a placeholder until WTD-918.
         * @constructor
         */
        function ActivityUtilization() {
            return {
                getPointCount: function () {
                    return 0;
                },
                getDomainValue: function (index) {
                    return 0;
                },
                getRangeValue: function (index) {
                    return 0;
                }
            };
        }

        return ActivityUtilization;
    }

);