/*global define,Promise*/

/**
 * Module defining AccordionController. Created by vwoeltje on 11/14/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function AccordionController() {
            var isExpanded = true;
            return {
                toggle: function () {
                    isExpanded = !isExpanded;
                },
                expanded: function () {
                    return isExpanded;
                }
            };
        }

        return AccordionController;
    }
);