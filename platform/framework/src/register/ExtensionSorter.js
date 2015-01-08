/*global define*/

define(
    ["../Constants"],
    function (Constants) {
        "use strict";

        /**
         * Responsible for applying priority order to extensions in a
         * given category. This will sort in reverse order of the numeric
         * priority given for extensions in the `priority` priority (such
         * that large values are registered first.) Extensions may also
         * specify symbolic properties as strings (instead of numbers),
         * which will be looked up from the table `Constants.PRIORITY_LEVELS`.
         * @param $log Angular's logging service
         * @constructor
         */
        function ExtensionSorter($log) {

            // Handle unknown or malformed priorities specified by extensions
            function unrecognizedPriority(extension) {
                // Issue a warning
                $log.warn([
                    "Unrecognized priority '",
                    (extension || {}).priority,
                    "' specified for extension from ",
                    ((extension || {}).bundle || {}).path,
                    "; defaulting to ",
                    Constants.DEFAULT_PRIORITY
                ].join(''));

                // Provide a return value (default priority) to make this
                // useful in an expression.
                return Constants.DEFAULT_PRIORITY;
            }

            function getPriority(extension) {
                var priority =
                    (extension || {}).priority || Constants.DEFAULT_PRIORITY;

                // If it's a symbolic priority, look it up
                if (typeof priority === 'string') {
                    priority = Constants.PRIORITY_LEVELS[priority];
                }

                // Should be a number; otherwise, issue a warning and
                // fall back to default priority level.
                return (typeof priority === 'number') ?
                        priority : unrecognizedPriority(extension);
            }

            // Attach a numeric priority to an extension; this is done in
            // one pass outside of the comparator, mainly because getPriority
            // may log warnings, and we only want this to happen once
            // (instead of the many times that might occur during a sort.)
            function prioritize(extension, index) {
                return {
                    // The extension itself, for later unwrapping
                    extension: extension,
                    // The index, to provide a stable sort (see compare)
                    index: index,
                    // The numeric priority of the extension
                    priority: getPriority(extension)
                };
            }

            // Unwrap the original extension
            // (for use after ordering has been applied)
            function deprioritize(prioritized) {
                return prioritized.extension;
            }

            // Compare two prioritized extensions
            function compare(a, b) {
                // Reverse order by numeric priority; or, original order.
                return (b.priority - a.priority) || (a.index - b.index);
            }

            return {
                /**
                 * Sort extensions according to priority.
                 *
                 * @param {object[]} extensions array of resolved extensions
                 * @returns {object[]} the same extensions, in priority order
                 */
                sort: function (extensions) {
                    return (extensions || [])
                        .map(prioritize)
                        .sort(compare)
                        .map(deprioritize);
                }
            };
        }

        return ExtensionSorter;
    }
);