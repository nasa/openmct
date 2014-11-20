/*global define,Promise*/

/**
 * Module defining ViewCapability. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * A `view` capability can be used to retrieve an array of
         * all views (or, more specifically, the declarative metadata
         * thereabout) which are applicable to a specific domain
         * object.
         *
         * @constructor
         */
        function ViewCapability(viewService, domainObject) {
            return {
                /**
                 * Get all view definitions which are applicable to
                 * this object.
                 * @returns {View[]} an array of view definitions
                 *          which are applicable to this object.
                 */
                invoke: function () {
                    return viewService.getViews(domainObject);
                }
            };
        }

        return ViewCapability;
    }
);