/*global define,Promise*/

/**
 * Module defining SomeProvider. Created by vwoeltje on 11/5/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function SomeProvider() {
            return {
                getMessages: function () {
                    return [
                        "I am a message from some provider."
                    ];
                }
            };
        }

        return SomeProvider;
    }
);