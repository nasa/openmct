/*global angular*/
define(
    [],
    function () {

        /**
         * The link step for the `mct-autoflow-table` directive;
         * watches scope and updates the DOM appropriately.
         * See documentation in `MCTAutoflowTable.js` for the rationale
         * for including this directive, as well as for an explanation
         * of which values are placed in scope.
         *
         * @constructor
         * @param {Scope} scope the scope for this usage of the directive
         * @param element the jqLite-wrapped element which used this directive
         */
        function AutoflowTableLinker(scope, element) {
            var objects, // Domain objects at last structure refresh
                rows, // Number of rows from last structure refresh
                priorClasses = {},
                valueSpans = {}; // Span elements to put data values in

            // Create a new name-value pair in the specified column
            function createListItem(domainObject, ul) {
                // Create a new li, and spans to go in it.
                var li = angular.element('<li>'),
                    titleSpan = angular.element('<span>'),
                    valueSpan = angular.element('<span>');

                // Place spans in the li, and li into the column.
                // valueSpan must precede titleSpan in the DOM due to new CSS float approach
                li.append(valueSpan).append(titleSpan);
                ul.append(li);

                // Style appropriately
                li.addClass('l-autoflow-row');
                titleSpan.addClass('l-autoflow-item l');
                valueSpan.addClass('l-autoflow-item r l-obj-val-format');

                // Set text/tooltip for the name-value row
                titleSpan.text(domainObject.getModel().name);
                titleSpan.attr("title", domainObject.getModel().name);

                // Keep a reference to the span which will hold the
                // data value, to populate in the next refreshValues call
                valueSpans[domainObject.getId()] = valueSpan;

                return li;
            }

            // Create a new column of name-value pairs in this table.
            function createColumn(el) {
                // Create a ul
                var ul = angular.element('<ul>');

                // Add it into the mct-autoflow-table
                el.append(ul);

                // Style appropriately
                ul.addClass('l-autoflow-col');

                // Get the current col width and apply at time of column creation
                // Important to do this here, as new columns could be created after
                // the user has changed the width.
                ul.css('width', scope.columnWidth + 'px');

                // Return it, so some li elements can be added
                return ul;
            }

            // Change the width of the columns when user clicks the resize button.
            function resizeColumn() {
                element.find('ul').css('width', scope.columnWidth + 'px');
            }

            // Rebuild the DOM associated with this table.
            function rebuild(domainObjects, rowCount) {
                var activeColumn;

                // Empty out our cached span elements
                valueSpans = {};

                // Start with an empty DOM beneath this directive
                element.html("");

                // Add DOM elements for each domain object being displayed
                // in this table.
                domainObjects.forEach(function (object, index) {
                    // Start a new column if we'd run out of room
                    if (index % rowCount === 0) {
                        activeColumn = createColumn(element);
                    }
                    // Add the DOM elements for that object to whichever
                    // column (a `ul` element) is current.
                    createListItem(object, activeColumn);
                });
            }

            // Update spans with values, as made available via the
            // `values` attribute of this directive.
            function refreshValues() {
                // Get the available values
                var values = scope.values || {},
                    classes = scope.classes || {};

                // Populate all spans with those values (or clear
                // those spans if no value is available)
                (objects || []).forEach(function (object) {
                    var id = object.getId(),
                        span = valueSpans[id],
                        value;

                    if (span) {
                        // Look up the value...
                        value = values[id];
                        // ...and convert to empty string if it's undefined
                        value = value === undefined ? "" : value;
                        span.attr("data-value", value);

                        // Update the span
                        span.text(value);
                        span.attr("title", value);
                        span.removeClass(priorClasses[id]);
                        span.addClass(classes[id]);
                        priorClasses[id] = classes[id];
                    }
                    // Also need stale/alert/ok class
                    // on span
                });
            }

            // Refresh the DOM for this table, if necessary
            function refreshStructure() {
                // Only rebuild if number of rows or set of objects
                // has changed; otherwise, our structure is still valid.
                if (scope.objects !== objects ||
                        scope.rows !== rows) {

                    // Track those values to support future refresh checks
                    objects = scope.objects;
                    rows = scope.rows;

                    // Rebuild the DOM
                    rebuild(objects || [], rows || 1);

                    // Refresh all data values shown
                    refreshValues();
                }
            }

            // Changing the domain objects in use or the number
            // of rows should trigger a structure change (DOM rebuild)
            scope.$watch("objects", refreshStructure);
            scope.$watch("rows", refreshStructure);

            // When the current column width has been changed, resize the column
            scope.$watch('columnWidth', resizeColumn);

            // When the last-updated time ticks,
            scope.$watch("updated", refreshValues);

            // Update displayed values when the counter changes.
            scope.$watch("counter", refreshValues);

        }

        return AutoflowTableLinker;
    }
);
