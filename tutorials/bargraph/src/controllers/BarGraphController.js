define(function () {
    function BarGraphController($scope, telemetryHandler) {
        var handle;

        // Expose configuration constants directly in scope
        function exposeConfiguration() {
            $scope.low = $scope.configuration.low;
            $scope.middle = $scope.configuration.middle;
            $scope.high = $scope.configuration.high;
        }

        // Populate a default value in the configuration
        function setDefault(key, value) {
            if ($scope.configuration[key] === undefined) {
                $scope.configuration[key] = value;
            }
        }

        // Getter-setter for configuration properties (for view proxy)
        function getterSetter(property) {
            return function (value) {
                value = parseFloat(value);
                if (!isNaN(value)) {
                    $scope.configuration[property] = value;
                    exposeConfiguration();
                }
                return $scope.configuration[property];
            };
        }

        // Add min/max defaults
        setDefault('low', -1);
        setDefault('middle', 0);
        setDefault('high', 1);
        exposeConfiguration($scope.configuration);

        // Expose view configuration options
        if ($scope.selection) {
            $scope.selection.proxy({
                low: getterSetter('low'),
                middle: getterSetter('middle'),
                high: getterSetter('high')
            });
        }

        // Convert value to a percent between 0-100
        $scope.toPercent = function (value) {
            var pct = 100 * (value - $scope.low) /
                ($scope.high - $scope.low);
            return Math.min(100, Math.max(0, pct));
        };

        // Get bottom and top (as percentages) for current value
        $scope.getBottom = function (telemetryObject) {
            var value = handle.getRangeValue(telemetryObject);
            return $scope.toPercent(Math.min($scope.middle, value));
        };
        $scope.getTop = function (telemetryObject) {
            var value = handle.getRangeValue(telemetryObject);
            return 100 - $scope.toPercent(Math.max($scope.middle, value));
        };

        // Use the telemetryHandler to get telemetry objects here
        handle = telemetryHandler.handle($scope.domainObject, function () {
            $scope.telemetryObjects = handle.getTelemetryObjects();
            $scope.barWidth =
                100 / Math.max(($scope.telemetryObjects).length, 1);
        });

        // Release subscriptions when scope is destroyed
        $scope.$on('$destroy', handle.unsubscribe);
    }

    return BarGraphController;
});
