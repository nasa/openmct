/*global define,Promise*/

/**
 * Module defining ViewCapability. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function ViewCapability(viewService, domainObject) {
            return {
                invoke: function () {
                    return viewService.getViews(domainObject);
                }
            };
        }

        return ViewCapability;
    }
);