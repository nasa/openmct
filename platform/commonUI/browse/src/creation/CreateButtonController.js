/*global define,Promise*/

/**
 * Module defining CreateController. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function CreateButtonController($scope, $document) {
            function collapse() {
                $scope.createState.visible = false;
                $scope.$apply("createState.visible");
                $document.off("mouseup", collapse);
                return false;
            }

            $scope.createState = { visible: false };

            $scope.toggle = function () {
                $scope.createState.visible = !$scope.createState.visible;
                if ($scope.createState.visible) {
                    $document.on("mouseup", collapse);
                }
            };

        }

        return CreateButtonController;
    }
);