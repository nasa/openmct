/*global define,Promise*/

/**
 * Module defining SomeOtherProvider. Created by vwoeltje on 11/5/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function SomeOtherProvider() {
            return {
                getMessages: function () {
                    return [
                        "I am a message from some other provider."
                    ];
                }
            };
        }

        return SomeOtherProvider;
    }
);