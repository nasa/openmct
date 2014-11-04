/*global define,Promise*/

/**
 * Module defining ExampleController. Created by vwoeltje on 11/4/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function ExampleController($scope) {
            $scope.phrase = "I am a controller.";
        }

        return ExampleController;
    }
);