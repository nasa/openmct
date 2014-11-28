/*global define*/

define(
    [],
    function () {

        function DateTimeController($scope) {

            function update() {
                var date = $scope.datetime.date,
                    hour = $scope.datetime.hour,
                    min = $scope.datetime.min,
                    sec = $scope.datetime.sec;

                $scope.ngModel[$scope.field] = [
                    date,
                    hour,
                    min,
                    sec
                ].join(".");
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