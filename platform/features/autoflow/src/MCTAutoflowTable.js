
define(
    ["./AutoflowTableLinker"],
    function (AutoflowTableLinker) {

        /**
         * The `mct-autoflow-table` directive specifically supports
         * autoflow tabular views; it is not intended for use outside
         * of that view.
         *
         * This directive is responsible for creating the structure
         * of the table in this view, and for updating its values.
         * While this is achievable using a regular Angular template,
         * this is undesirable from the perspective of performance
         * due to the number of watches that can be involved for large
         * tables. Instead, this directive will maintain a small number
         * of watches, rebuilding table structure only when necessary,
         * and updating displayed values in the more common case of
         * new data arriving.
         *
         * @constructor
         */
        function MCTAutoflowTable() {
            return {
                // Only applicable at the element level
                restrict: "E",

                // The link function; handles DOM update/manipulation
                link: AutoflowTableLinker,

                // Parameters to pass from attributes into scope
                scope: {
                    // Set of domain objects to show in the table
                    objects: "=",

                    // Values for those objects, by ID
                    values: "=",

                    // CSS classes to show for objects, by ID
                    classes: "=",

                    // Number of rows to show before autoflowing
                    rows: "=",

                    // Time of last update; watched to refresh values
                    updated: "=",

                    // Current width of the autoflow column
                    columnWidth: "=",

                    // A counter used to trigger display updates
                    counter: "="
                }
            };
        }

        return MCTAutoflowTable;

    }
);
