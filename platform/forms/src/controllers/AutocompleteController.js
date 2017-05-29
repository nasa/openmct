/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    [],
    function () {

        /**
         * Controller for the `autocomplete` form control.
         *
         * @memberof platform/forms
         * @constructor
         */
        function AutocompleteController($scope) {

            var key = {
                down: 40,
                up: 38,
                enter: 13
            }

            if($scope.options[0].name) {
                // If "options" include name, value pair
                $scope.optionNames = $scope.options.map(function(opt) {
                    return opt.name;
                })
            } else {
                // If options is only an array of string.
                $scope.optionNames = $scope.options;
            }

            function decrementOptionIndex() {
                if($scope.optionIndex === 0) {
                    $scope.optionIndex = $scope.filteredOptions.length;
                }
                $scope.optionIndex--;
            }

            function incrementOptionIndex() {
                if($scope.optionIndex === $scope.filteredOptions.length-1) {
                    $scope.optionIndex = -1;
                }
                $scope.optionIndex++;
            }

            function fillInputWithString(string) {
                $scope.hideOptions = true;
                // Hard coded!!
                $scope.ngModel[4] = string;
            }

            function fillInputWithIndexedOption() {
                $scope.ngModel[4] = $scope.filteredOptions[$scope.optionIndex].name;
            }

            $scope.keyDown = function($event) {
                if($scope.filteredOptions) {
                    var keyCode = $event.keyCode;
                    switch(keyCode) {
                        case key.down:
                            incrementOptionIndex();
                            fillInputWithIndexedOption();
                            break;
                        case key.up:
                            $event.preventDefault();    // Prevents cursor jumping back and forth
                            decrementOptionIndex();
                            fillInputWithIndexedOption();
                            break;
                        case key.enter:
                            if($scope.filteredOptions[$scope.optionIndex]) {
                                fillInputWithString($scope.filteredOptions[$scope.optionIndex].name);
                            }
                    }
                }
            }

            $scope.filterOptions = function(string) {
                $scope.hideOptions = false;
                $scope.filteredOptions = $scope.optionNames.filter(function(option) {
                    return option.toLowerCase().indexOf(string.toLowerCase()) >= 0;
                }).map(function(option, index) {
                    return {
                        optionId: index,
                        name: option
                    }
                });
            }

            $scope.inputClicked = function($event) {
                var target = $event.target;
                target.select();
                $scope.hideOptions = false;
                $scope.filterOptions(target.value);
                $scope.optionIndex = 0;
            }
            
            $scope.fillInput = function(string) {
                fillInputWithString(string);
            }

            $scope.optionMouseover = function(optionId) {
                $scope.optionIndex = optionId;
            }
        }

        return AutocompleteController;

    }
);