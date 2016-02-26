/*global define*/

define(
    [],
    function () {
        "use strict";

        function MCTTable($timeout) {
            return {
                restrict: "E",
                templateUrl: "platform/features/table/res/templates/mct-data-table.html",
                controller: 'MCTTableController',
                scope: {
                    headers: "=",
                    rows: "=",
                    enableFilter: "=?",
                    enableSort: "=?"
                }
            };
        }

        return MCTTable;
    }
);
