/*global define,Promise*/

/**
 * Module defining SomeOtherDecorator. Created by vwoeltje on 11/5/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function SomeOtherDecorator(someProvider) {
            return {
                getMessages: function () {
                    return someProvider.getMessages().map(function (msg) {
                        return msg + "...";
                    });
                }
            };
        }

        return SomeOtherDecorator;
    }
);