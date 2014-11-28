/*global define*/

define(
    ["../../lib/moment.min"],
    function () {

        var DATE_FORMAT = "YYYY-DDD";

        /**
         * Controller for the `datetime` form control.
         * This is a composite control; it includes multiple
         * input fields but outputs a single timestamp (in
         * milliseconds since start of 1970) to the ngModel.
         *
         * @constructor
         */
        function DateTimeController($scope) {

            // Update the
            function update() {
                var date = $scope.datetime.date,
                    hour = $scope.datetime.hour,
                    min = $scope.datetime.min,
                    sec = $scope.datetime.sec,
                    fullDateTime = moment.utc(date, DATE_FORMAT)
                            .hour(hour || 0)
                            .minute(min || 0)
                            .second(sec || 0);

                if (fullDateTime.isValid()) {
                    $scope.ngModel[$scope.field] = fullDateTime.valueOf();
                }
            }

            // Update value whenever any field changes.
            $scope.$watch("datetime.date", update);
            $scope.$watch("datetime.hour", update);
            $scope.$watch("datetime.min", update);
            $scope.$watch("datetime.sec", update);

            $scope.datetime = {};
        }

        return DateTimeController;

    }
);