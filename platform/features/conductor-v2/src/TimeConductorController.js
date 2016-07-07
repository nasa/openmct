/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    [],
    function () {

        var SIX_HOURS = 6 * 60 * 60 * 1000;

        function TimeConductorController($scope, $timeout, conductor) {
            var now = Date.now();
            var self = this;

            this.$scope = $scope;
            this.conductor = conductor;

            $scope.formModel = {};

            conductor.on('bounds', function (bounds) {
                $scope.formModel = {
                    start: bounds.start,
                    end: bounds.end
                };
            });

            //Temporary workaround for resizing issue
            $timeout(function() {
                //Set the time conductor to some default
                conductor.bounds({start: now - SIX_HOURS, end: now});
            }, 1000);

            Object.keys(TimeConductorController.prototype).filter(function (key){
                return typeof TimeConductorController.prototype[key] === 'function';
            }).forEach(function (key) {
                self[key] = self[key].bind(self);
            });
        }

        TimeConductorController.prototype.validateStart = function (start) {
            var bounds = this.conductor.bounds();
            return this.conductor.validateBounds({start: start, end: bounds.end}) === true;
        };

        TimeConductorController.prototype.validateEnd = function (end) {
            var bounds = this.conductor.bounds();
            return this.conductor.validateBounds({start: bounds.start, end: end}) === true;
        };

        TimeConductorController.prototype.updateBoundsFromForm = function (formModel) {
            var newBounds = {start: formModel.start, end: formModel.end};

            if (this.conductor.validateBounds(newBounds) === true) {
                this.conductor.bounds(newBounds);
            }
        };

        return TimeConductorController;
    }
);
