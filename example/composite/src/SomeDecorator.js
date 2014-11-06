/*global define,Promise*/

/**
 * Module defining SomeDecorator. Created by vwoeltje on 11/5/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function SomeDecorator(someProvider) {
            return {
                getMessages: function () {
                    return someProvider.getMessages().map(function (msg) {
                        return msg.toLocaleUpperCase();
                    });
                }
            };
        }

        return SomeDecorator;
    }
);