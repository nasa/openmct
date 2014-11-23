/*global define,Promise*/

/**
 * Module defining UUIDService. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function UUIDService() {
            var counter = Date.now();

            return {
                getUUID: function () {
                    counter += 1;
                    return counter.toString(36);
                }

            };
        }

        return UUIDService;
    }
);