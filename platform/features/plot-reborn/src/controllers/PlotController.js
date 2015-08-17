/*global define*/

define(
    [],
    function () {
        "use strict";

        // TODO: Store this in more accessible locations / retrieve from
        // domainObject metadata.
        var DOMAIN_INTERVAL = 2 * 60 * 1000; // Two minutes.

        function PlotController($scope, colorService) {
            var plotHistory = [],
                isLive = true,
                maxDomain = +new Date(),
                subscriptions = [],
                palette = new colorService.ColorPalette();


            function setToDefaultViewport() {
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
            }

            setToDefaultViewport();

            $scope.displayableRange = function (rangeValue) {
                // TODO: Call format function provided by domain object.
                return rangeValue;
            };
            $scope.displayableDomain = function (domainValue) {
                // TODO: Call format function provided by domain object.
                return new Date(domainValue).toUTCString();
            };

            $scope.series = [];

            $scope.rectangles = [];

            function updateSeriesFromTelemetry(series, seriesIndex, telemetry) {
                var domainValue = telemetry.getDomainValue(
                        telemetry.getPointCount() - 1
                    ),
                    rangeValue = telemetry.getRangeValue(
                        telemetry.getPointCount() - 1
                    ),
                    newTelemetry;
                // Track the biggest domain we've seen for sticky-ness.
                maxDomain = Math.max(maxDomain, domainValue);

                newTelemetry = {
                    domain: domainValue,
                    range: rangeValue
                };
                series.data.push(newTelemetry);
                $scope.$broadcast('series:data:add', seriesIndex, [newTelemetry]);
            }

            function subscribeToDomainObject(domainObject) {
                var telemetryCapability = domainObject.getCapability('telemetry'),
                    model = domainObject.getModel(),
                    series,
                    seriesIndex,
                    updater;

                series = {
                    name: model.name,
                    // TODO: Bring back PlotPalette.
                    color: palette.getColor($scope.series.length),
                    data: []
                };

                $scope.series.push(series);
                seriesIndex = $scope.series.indexOf(series);

                updater = updateSeriesFromTelemetry.bind(
                    null,
                    series,
                    seriesIndex
                );
                subscriptions.push(telemetryCapability.subscribe(updater));
            }

            function unlinkDomainObject() {
                subscriptions.forEach(function(subscription) {
                    subscription.unsubscribe();
                });
                subscriptions = [];
            }


            function linkDomainObject(domainObject) {
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
            }


            function onUserViewportChangeStart() {
                // TODO: this is a great time to track a history entry.
                // Disable live mode so they have full control of viewport.
                plotHistory.push($scope.viewport);
                isLive = false;
            }

            function onUserViewportChangeEnd(event, viewport) {
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
            }

             function viewportForMaxDomain() {
                 return {
                    topLeft: {
                        range: $scope.viewport.topLeft.range,
                        domain: maxDomain - DOMAIN_INTERVAL
                    },
                    bottomRight: {
                        range: $scope.viewport.bottomRight.range,
                        domain: maxDomain
                    }
                };
            }
            
            function onPinchAction(event) {
                console.log("TEST");
            }

            function followDataIfLive() {
                if (isLive) {
                    $scope.viewport = viewportForMaxDomain();
                }
            }

            $scope.$on('series:data:add', followDataIfLive);
            $scope.$on('user:viewport:change:end', onUserViewportChangeEnd);
            $scope.$on('user:viewport:change:start', onUserViewportChangeStart);
            $scope.$on('mct:pinch:action', onPinchAction);

            $scope.$watch('domainObject', linkDomainObject);

            return {
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
        }

        return PlotController;

    }
);
