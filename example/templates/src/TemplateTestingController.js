/*global define*/
define([], function () {
    'use strict';

    return function TemplateTestingController($scope, objectService) {
        $scope.ikey = '';
        $scope.rkey = '';
        $scope.rid = '';
        $scope.obj = undefined;

        $scope.$watch('rid', function (id) {
            $scope.obj = undefined;
            objectService.getObjects([id]).then(function (objs) {
                $scope.obj = objs[id];
            });
        });
    };
});
