/*global define*/

define(
    [
        "../controllers/MCTTableController",
        "text!../../res/templates/mct-table.html"
    ],
    function (MCTTableController, TableTemplate) {
        "use strict";

        /**
         * Defines a generic 'Table' component. The table can be populated
         * en-masse by setting the rows attribute, or rows can be added as
         * needed via a broadcast 'addRow' event.
         *
         * This directive accepts parameters specifying header and row
         * content, as well as some additional options.
         *
         * Two broadcast events for notifying the table that the rows have
         * changed. For performance reasons, the table does not monitor the
         * content of `rows` constantly.
         * - 'add:row': A $broadcast event that will notify the table that
         * a new row has been added to the table.
         * eg.
         * <pre><code>
         * $scope.rows.push(newRow);
         * $scope.$broadcast('add:row', $scope.rows.length-1);
         * </code></pre>
         * The code above adds a new row, and alerts the table using the
         * add:row event. Sorting and filtering will be applied
         * automatically by the table component.
         *
         * - 'remove:row': A $broadcast event that will notify the table that a
         * row should be removed from the table.
         * eg.
         * <pre><code>
         * $scope.rows.slice(5, 1);
         * $scope.$broadcast('remove:row', 5);
         * </code></pre>
         * The code above removes a row from the rows array, and then alerts
         * the table to its removal.
         *
         * @memberof platform/features/table
         * @param {string[]} headers The column titles to appear at the top
         * of the table. Corresponding values are specified in the rows
         * using the header title provided here.
         * @param {Object[]} rows The row content. Each row is an object
         * with key-value pairs where the key corresponds to a header
         * specified in the headers parameter.
         * @param {boolean} enableFilter If true, values will be searchable
         * and results filtered
         * @param {boolean} enableSort If true, sorting will be enabled
         * allowing sorting by clicking on column headers
         * @param {boolean} autoScroll If true, table will automatically
         * scroll to the bottom as new data arrives. Auto-scroll can be
         * disengaged manually by scrolling away from the bottom of the
         * table, and can also be enabled manually by scrolling to the bottom of
         * the table rows.
         *
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
