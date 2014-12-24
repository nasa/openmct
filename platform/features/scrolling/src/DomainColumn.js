/*global define,moment*/

/**
 * Module defining DomainColumn. Created by vwoeltje on 11/18/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * A column which will report telemetry domain values
         * (typically, timestamps.) Used by the ScrollingListController.
         *
         * @constructor
         * @param domainMetadata an object with the machine- and human-
         *        readable names for this domain (in `key` and `name`
         *        fields, respectively.)
         * @param {TelemetryFormatter} telemetryFormatter the telemetry
         *        formatting service, for making values human-readable.
         */
        function DomainColumn(domainMetadata, telemetryFormatter) {
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
                    return telemetryFormatter.formatDomainValue(
                        data.getDomainValue(index, domainMetadata.key)
                    );
                }
            };
        }

        return DomainColumn;
    }
);