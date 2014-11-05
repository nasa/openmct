/*global define,Promise*/

/**
 * Module defining ExampleDirective. Created by vwoeltje on 11/4/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function ExampleDirective() {
            return {
                template: "And this came from a directive."
            };
        }

        return ExampleDirective;
    }
);