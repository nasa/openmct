/*global define */

define(
    function () {
        "use strict";

        function StackedPlotController($scope) {

            $scope.telemetryObjects = [];

            var linkDomainObject = function(domainObject) {
                if (domainObject.hasCapability('telemetry')) {
                    $scope.telemetryObjects = [domainObject];
                } else if (domainObject.hasCapability('delegation')) {

                    var addObjectsIfCompatible = function(objects) {
                        objects.forEach(function(object) {
                            if (object.hasCapability('telemetry')) {
                                $scope.telemetryObjects.push(object);
                            } else if (object.hasCapability('delegation')) {
                                $scope.telemetryObjects.push(object);
                            }
                        });
                    };
                    domainObject
                        .useCapability('composition')
                        .then(addObjectsIfCompatible);
                        // TODO: should have a catch.
                } else {
                    throw new Error('Domain object type not supported.');
                }
            };
            $scope.$watch('domainObject', linkDomainObject);
        }
        return StackedPlotController;
    }
);
