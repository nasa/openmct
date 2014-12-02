/*global define,moment*/

/**
 * Module defining DomainColumn. Created by vwoeltje on 11/18/14.
 */
define(
    ["../../plot/lib/moment.min"],
    function () {
        "use strict";

        // Date format to use for domain values; in particular,
        // use day-of-year instead of month/day
        var DATE_FORMAT = "YYYY-DDD HH:mm:ss";

        /**
         * A column which will report telemetry domain values
         * (typically, timestamps.) Used by the ScrollingListController.
         *
         * @constructor
         * @param domainMetadata an object with the machine- and human-
         *        readable names for this domain (in `key` and `name`
         *        fields, respectively.)
         */
        function DomainColumn(domainMetadata) {
            return {
                /**
                 * Get the title to display in this column's header.
                 * @returns {string} the title to display
                 */
                getTitle: function () {
                    return domainMetadata.name;
                },
                /**
                 * Get the text to display inside a row under this
                 * column.
                 * @returns {string} the text to display
                 */
                getValue: function (domainObject, data, index) {
                    return moment.utc(data.getDomainValue(
                        index,
                        domainMetadata.key
                    )).format(DATE_FORMAT);
                }
            };
        }

        return DomainColumn;
    }
);