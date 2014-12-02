/*global define,Promise*/

/**
 * Module defining NameColumn. Created by vwoeltje on 11/18/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * A column which will report the name of the domain object
         * which exposed specific telemetry values.
         *
         * @constructor
         */
        function NameColumn() {
            return {
                /**
                 * Get the title to display in this column's header.
                 * @returns {string} the title to display
                 */
                getTitle: function () {
                    return "Name";
                },
                /**
                 * Get the text to display inside a row under this
                 * column. This returns the domain object's name.
                 * @returns {string} the text to display
                 */
                getValue: function (domainObject) {
                    return domainObject.getModel().name;
                }
            };
        }

        return NameColumn;
    }
);