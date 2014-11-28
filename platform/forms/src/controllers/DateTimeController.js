/*global define*/

define(
    ["../../lib/moment.min"],
    function () {

        var DATE_FORMAT = "YYYY-DDD";

        function DateTimeController($scope) {

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

            $scope.$watch("datetime.date", update);
            $scope.$watch("datetime.hour", update);
            $scope.$watch("datetime.min", update);
            $scope.$watch("datetime.sec", update);

            $scope.datetime = {};
        }

        return DateTimeController;

    }
);