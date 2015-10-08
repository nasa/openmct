/*global define*/

define(function () {
    'use strict';
    return function CLIController($scope) {
        $scope.stdout = [];
        $scope.stdin = "";

        $scope.enter = function (input) {
            $scope.stdin = "";
            $scope.stdout.push("");
            $scope.stdout.push(input);
            $scope.stdout.push("");
        };
    };
});
