/*global define,Promise*/

/**
 * Module defining SomeExample. Created by vwoeltje on 11/5/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function SomeExample(exampleService, message) {
            return {
                getText: function () {
                    return [
                        '"',
                        exampleService.getMessage(),
                        '" and "',
                        message,
                        '"'
                    ].join("");
                }
            };
        }

        return SomeExample;
    }
);