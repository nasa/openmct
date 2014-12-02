/*global define,Promise*/

/**
 * Module defining NameColumn. Created by vwoeltje on 11/18/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function NameColumn() {
            return {
                getTitle: function () {
                    return "Name";
                },
                getValue: function (domainObject) {
                    return domainObject.getModel().name;
                }
            };
        }

        return NameColumn;
    }
);