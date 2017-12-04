/*global define */

define([
    'lodash'
], function (
    _
) {
    'use strict';

    function StackedPlotController($scope, openmct, objectService, $element, exportImageService) {
        var tickWidth = 0,
            newFormatObject,
            composition,
            currentRequest,
            unlisten,
            tickWidthMap = {};

        this.$element = $element;
        this.exportImageService = exportImageService;

        $scope.telemetryObjects = [];

        function oldId(newIdentifier) {
            var idParts = [];
            if (newIdentifier.namespace) {
                idParts.push(newIdentifier.namespace.replace(/\:/g, '\\:'));
            }
            idParts.push(newIdentifier.key);
            return idParts.join(':');
        }

        function onDomainObjectChange(domainObject) {
            var thisRequest = currentRequest = $scope.currentRequest = {
                pending: 0
            };
            var telemetryObjects = $scope.telemetryObjects = [];
            var thisTickWidthMap = tickWidthMap = {};

            if (unlisten) {
                unlisten();
                unlisten = undefined;
            }

            function addChild(child) {
                var id = oldId(child.identifier);
                thisTickWidthMap[id] = 0;
                thisRequest.pending += 1;
                objectService.getObjects([id])
                    .then(function (objects) {
                        thisRequest.pending -= 1;
                        var childObj = objects[id];
                        telemetryObjects.push(childObj);
                    });
            }

            function removeChild(childIdentifier) {
                var id = oldId(childIdentifier);
                delete thisTickWidthMap[id];
                var childObj = telemetryObjects.filter(function (c) {
                    return c.getId() === id;
                })[0];
                if (childObj) {
                    var index = telemetryObjects.indexOf(childObj);
                    telemetryObjects.splice(index, 1);
                    $scope.$broadcast('plot:tickWidth', _.max(tickWidthMap));
                }
            }
            thisRequest.pending += 1;
            openmct.objects.get(domainObject.getId())
                    .then(function (obj) {
                        thisRequest.pending -= 1;
                        if (thisRequest !== currentRequest) {
                            return;
                        }
                        newFormatObject = obj;
                        composition = openmct.composition.get(obj);
                        composition.on('add', addChild);
                        composition.on('remove', removeChild);
                        composition.load();
                        unlisten = function () {
                            composition.off('add', addChild);
                            composition.off('remove', removeChild);
                        };
                    });
        }

        $scope.$watch('domainObject', onDomainObjectChange);

        $scope.$on('plot:tickWidth', function ($e, width) {
            var plotId = $e.targetScope.domainObject.getId();
            if (!tickWidthMap.hasOwnProperty(plotId)) {
                return;
            }
            tickWidthMap[plotId] = Math.max(width, tickWidthMap[plotId]);
            var newTickWidth = _.max(tickWidthMap);
            if (newTickWidth !== tickWidth || width !== tickWidth) {
                tickWidth = newTickWidth;
                $scope.$broadcast('plot:tickWidth', tickWidth);
            }
        });

        $scope.$on('plot:highlight:update', function ($e, point) {
            $scope.$broadcast('plot:highlight:set', point);
        });
    }

    StackedPlotController.prototype.exportJPG = function () {
        this.hideExportButtons = true;
        this.exportImageService.exportJPG(this.$element[0], 'stacked-plot.jpg')
            .finally(function () {
                this.hideExportButtons = false;
            }.bind(this));
    };

    StackedPlotController.prototype.exportPNG = function () {
        this.hideExportButtons = true;
        this.exportImageService.exportPNG(this.$element[0], 'stacked-plot.png')
            .finally(function () {
                this.hideExportButtons = false;
            }.bind(this));
    };

    return StackedPlotController;
});
