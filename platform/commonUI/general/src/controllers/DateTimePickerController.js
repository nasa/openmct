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
/*global define,Promise*/

define(
    [ 'moment' ],
    function (moment) {
        'use strict';

        var TIME_NAMES = {
                'hours': "Hour",
                'minutes': "Minute",
                'seconds': "Second"
            },
            MONTHS = moment.months();

        /**
         * Controller to support the date-time picker.
         *
         * Adds/uses the following properties in scope:
         * * `year`: Year being displayed in picker
         * * `month`: Month being displayed
         * * `table`: Table being displayed; array of arrays of
         *   * `day`: Day of month
         *   * `dayOfYear`: Day of year
         *   * `month`: Month associated with the day
         *   * `year`: Year associated with the day.
         * * `date`: Date chosen
         *   * `year`: Year selected
         *   * `month`: Month selected (0-indexed)
         *   * `day`: Day of month selected
         * * `time`: Chosen time (hours/minutes/seconds)
         *   * `hours`: Hours chosen
         *   * `minutes`: Minutes chosen
         *   * `seconds`: Seconds chosen
         */
        function DateTimePickerController($scope) {
            var year = 2015,
                month = 8; // For picker state, not model state

            function generateTableCell() {

            }

            function generateTable() {
                var m = moment.utc({ year: year, month: month }).day(0),
                    table = [],
                    row,
                    col;

                for (row = 0; row < 6; row += 1) {
                    table.push([]);
                    for (col = 0; col < 7; col += 1) {
                        table[row].push({
                            year: m.year(),
                            month: m.month(),
                            day: m.date(),
                            dayOfYear: m.dayOfYear()
                        });
                        m.add(1, 'days'); // Next day!
                    }
                }

                return table;
            }

            function updateScopeForMonth() {
                $scope.month = MONTHS[month];
                $scope.year = year;
                $scope.table = generateTable();
                console.log($scope.table);
            }

            $scope.isSelectable = function (cell) {
                return cell.month === month;
            }

            $scope.dateEquals = function (d1, d2) {
                return d1.year === d2.year &&
                    d1.month === d2.month &&
                    d1.day === d2.day;
            };

            $scope.changeMonth = function (delta) {
                month += delta;
                if (month > 11) {
                    month = 0;
                    year += 1;
                }
                if (month < 0) {
                    month = 11;
                    year -= 1;
                }
                updateScopeForMonth();
            };

            $scope.nameFor = function (key) {
                return TIME_NAMES[key];
            };

            updateScopeForMonth();
        }

        return DateTimePickerController;
    }
);
