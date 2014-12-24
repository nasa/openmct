/*global define,Promise*/

/**
 * Module defining DomainColumn. Created by vwoeltje on 11/18/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * A column which will report telemetry range values
         * (typically, measurements.) Used by the ScrollingListController.
         *
         * @constructor
         * @param rangeMetadata an object with the machine- and human-
         *        readable names for this range (in `key` and `name`
         *        fields, respectively.)
         * @param {TelemetryFormatter} telemetryFormatter the telemetry
         *        formatting service, for making values human-readable.
         */
        function RangeColumn(rangeMetadata, telemetryFormatter) {
            return {
                /**
                 * Get the title to display in this column's header.
                 * @returns {string} the title to display
                 */
                getTitle: function () {
                    return rangeMetadata.name;
                },
                /**
                 * Get the text to display inside a row under this
                 * column.
                 * @returns {string} the text to display
                 */
                getValue: function (domainObject, data, index) {
                    return telemetryFormatter.formatRangeValue(
                        data.getRangeValue(index, rangeMetadata.key)
                    );
                }
            };
        }

        return RangeColumn;
    }
);