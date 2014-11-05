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
        function ExampleController($scope, exampleService) {
            $scope.phrase = exampleService.getMessage();
        }

        return ExampleController;
    }
);