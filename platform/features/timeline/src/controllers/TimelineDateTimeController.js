/*global define,moment*/

define(
    [],
    function () {
        "use strict";

        /**
         * Controller for the `datetime` form control.
         * This is a composite control; it includes multiple
         * input fields but outputs a single timestamp (in
         * milliseconds since start of 1970) to the ngModel.
         *
         * @constructor
         */
        function DateTimeController($scope) {

            // Update the data model
            function updateModel(datetime) {
                var days = parseInt(datetime.days, 10) || 0,
                    hour = parseInt(datetime.hours, 10) || 0,
                    min = parseInt(datetime.minutes, 10) || 0,
                    sec = parseInt(datetime.seconds, 10) || 0,
                    epoch = "SET", // Only permit SET, for now
                    timestamp;

                // Build up timestamp
                timestamp = days * 24;
                timestamp = (hour + timestamp) * 60;
                timestamp = (min + timestamp) * 60;
                timestamp = (sec + timestamp) * 1000;

                // Set in the model
                $scope.ngModel[$scope.field] = {
                    timestamp: timestamp,
                    epoch: epoch
                };
            }

            // Update the displayed state
            function updateForm(modelState) {
                var timestamp = (modelState || {}).timestamp || 0,
                    datetime = $scope.datetime;

                timestamp = Math.floor(timestamp / 1000);
                datetime.seconds = timestamp % 60;
                timestamp = Math.floor(timestamp / 60);
                datetime.minutes = timestamp % 60;
                timestamp = Math.floor(timestamp / 60);
                datetime.hours = timestamp % 24;
                timestamp = Math.floor(timestamp / 24);
                datetime.days = timestamp;
            }

            // Retrieve state from field, for watch
            function getModelState() {
                return $scope.ngModel[$scope.field];
            }

            // Update value whenever any field changes.
            $scope.$watchCollection("datetime", updateModel);
            $scope.$watchCollection(getModelState, updateForm);

            // Initialize the scope
            $scope.datetime = {};
            updateForm(getModelState());
        }

        return DateTimeController;

    }
);