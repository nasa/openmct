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
    [
        "../controllers/MCTTableController",
        "text!../../res/templates/mct-table.html"
    ],
    function (MCTTableController, TableTemplate) {
        /**
         * Defines a generic 'Table' component. The table can be populated
         * en-masse by setting the rows attribute, or rows can be added as
         * needed via a broadcast 'addRow' event.
         * @constructor
         */
        function MCTTable($timeout) {
            return {
                restrict: "E",
                template: TableTemplate,
                controller: ['$scope', '$timeout', '$element', MCTTableController],
                scope: {
                    headers: "=",
                    rows: "=",
                    enableFilter: "=?",
                    enableSort: "=?",
                    autoScroll: "=?"
                },
            };
        }

        return MCTTable;
    }
);
