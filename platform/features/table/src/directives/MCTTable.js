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
