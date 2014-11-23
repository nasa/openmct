/*global define,Promise*/

/**
 * Module defining NewWindowAction. Created by vwoeltje on 11/18/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function NewWindowAction($window) {
            return {
                perform: function () {
                    $window.alert("Not yet functional. This will open objects in a new window.");
                }
            };
        }

        return NewWindowAction;
    }
);