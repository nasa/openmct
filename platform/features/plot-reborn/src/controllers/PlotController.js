/*global define*/

define(
    [],
    function () {
        "use strict";

        // TODO: Store this in more accessible locations / retrieve from
        // domainObject metadata.
        var DOMAIN_INTERVAL = 1 * 60 * 1000; // One minute.

        function PlotController($scope, colorService) {
            var plotHistory = [];
            var isLive = true;
            var maxDomain = +new Date();
            var subscriptions = [];
            var palette = new colorService.ColorPalette();
            var setToDefaultViewport = function() {
                // TODO: We shouldn't set the viewport until we have received data or something has given us a reasonable viewport.
                $scope.viewport = {
                    topLeft: {
                        domain: maxDomain - DOMAIN_INTERVAL,
                        range: 1
                    },
                    bottomRight: {
                        domain: maxDomain,
                        range: -1
                    }
                };
            };

            setToDefaultViewport();

            $scope.displayableRange = function(rangeValue) {
                // TODO: Call format function provided by domain object.
                return rangeValue;
            };
            $scope.displayableDomain = function(domainValue) {
                // TODO: Call format function provided by domain object.
                return new Date(domainValue).toUTCString();
            };

            $scope.series = [];

            $scope.rectangles = [];

            var updateSeriesFromTelemetry = function(series, seriesIndex, telemetry) {
                var domainValue = telemetry.getDomainValue(telemetry.getPointCount() - 1);
                var rangeValue = telemetry.getRangeValue(telemetry.getPointCount() - 1);
                // Track the biggest domain we've seen for sticky-ness.
                maxDomain = Math.max(maxDomain, domainValue);

                var newTelemetry = {
                    domain: domainValue,
                    range: rangeValue
                };
                series.data.push(newTelemetry);
                $scope.$broadcast('series:data:add', seriesIndex, [newTelemetry]);
            };

            var subscribeToDomainObject = function(domainObject) {
                var telemetryCapability = domainObject.getCapability('telemetry');
                var model = domainObject.getModel();

                var series = {
                    name: model.name,
                    // TODO: Bring back PlotPalette.
                    color: palette.getColor($scope.series.length),
                    data: []
                };

                $scope.series.push(series);
                var seriesIndex = $scope.series.indexOf(series);

                var updater = updateSeriesFromTelemetry.bind(
                    null,
                    series,
                    seriesIndex
                );
                subscriptions.push(telemetryCapability.subscribe(updater));
            };

            var linkDomainObject = function(domainObject) {
                unlinkDomainObject();
                if (domainObject.hasCapability('telemetry')) {
                    subscribeToDomainObject(domainObject);
                } else if (domainObject.hasCapability('delegation')) {
                    // Makes no sense that we have to use a subscription to get domain objects associated with delegates (and their names).  We can map the same series generation code to telemetry delegates; Let's do that ourselves.
                    var subscribeToDelegates = function(delegates) {
                        return delegates.forEach(subscribeToDomainObject);
                        // TODO: Should return a promise.
                    };
                    domainObject
                        .getCapability('delegation')
                        .getDelegates('telemetry')
                        .then(subscribeToDelegates);
                        // TODO: should have a catch.
                } else {
                    throw new Error('Domain object type not supported.');
                }
            };

            var unlinkDomainObject = function() {
                subscriptions.forEach(function(subscription) {
                    subscription.unsubscribe();
                });
                subscriptions = [];
            };

            var onUserViewportChangeStart = function() {
                // TODO: this is a great time to track a history entry.
                // Disable live mode so they have full control of viewport.
                plotHistory.push($scope.viewport);
                isLive = false;
            };

            var onUserViewportChangeEnd = function(event, viewport) {
                // If the new viewport is "close enough" to the maxDomain then
                // enable live mode.  Set empirically to 10% of the domain
                // interval.
                // TODO: Better UX pattern for this.

                if (Math.abs(maxDomain - viewport.bottomRight.domain) < (DOMAIN_INTERVAL/10)) {
                    isLive = true;
                    $scope.viewport.bottomRight.domain = maxDomain;
                } else {
                    isLive = false;
                }
                plotHistory.push(viewport);
            };

            var viewportForMaxDomain = function() {
                var viewport = {
                    topLeft: {
                        range: $scope.viewport.topLeft.range,
                        domain: maxDomain - DOMAIN_INTERVAL
                    },
                    bottomRight: {
                        range: $scope.viewport.bottomRight.range,
                        domain: maxDomain
                    }
                };
                return viewport;
            };

            var followDataIfLive = function() {
                if (isLive) {
                    $scope.viewport = viewportForMaxDomain();
                }
            };

            $scope.$on('series:data:add', followDataIfLive);
            $scope.$on('user:viewport:change:end', onUserViewportChangeEnd);
            $scope.$on('user:viewport:change:start', onUserViewportChangeStart);

            $scope.$watch('domainObject', linkDomainObject);

            var controller = {
                historyBack: function() {
                    // TODO: Step History Back.
                },
                historyForward: function() {
                    // TODO: Step History Forward.
                },
                resetZoom: function() {
                    // TODO: Reset view to defaults.  Keep history stack alive?
                }
            };

            return controller;
        }

        return PlotController;

    }
);
