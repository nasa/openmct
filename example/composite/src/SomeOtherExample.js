/*global define,Promise*/

/**
 * Module defining SomeOtherExample. Created by vwoeltje on 11/5/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function SomeOtherExample(someService) {
            return {
                getText: function () {
                    return someService.getMessages().join(" | ");
                }
            };
        }

        return SomeOtherExample;
    }
);