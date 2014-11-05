/*global define,Promise*/

/**
 * Module defining ExampleService. Created by vwoeltje on 11/4/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function ExampleService() {
            return {
                getMessage: function () {
                    return "I heard this from a service";
                }
            };
        }

        return ExampleService;
    }
);