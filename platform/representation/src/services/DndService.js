/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Drag-and-drop service.
         * Supplements HTML5 drag-and-drop support by:
         * * Storing arbitrary JavaScript objects (not just strings.)
         * * Allowing inspection of dragged objects during `dragover` events,
         *   etc. (which cannot be done in Chrome for security reasons)
         * @constructor
         * @param $log Angular's $log service
         */
        function DndService($log) {
            var data = {};

            return {
                /**
                 * Set drag data associated with a given type.
                 * @param {string} key the type's identiifer
                 * @param {*} value the data being dragged
                 */
                setData: function (key, value) {
                    $log.debug("Setting drag data for " + key);
                    data[key] = value;
                },
                /**
                 * Get drag data associated with a given type.
                 * @returns {*} the data being dragged
                 */
                getData: function (key) {
                    return data[key];
                },
                /**
                 * Remove data associated with active drags.
                 * @param {string} key the type to remove
                 */
                removeData: function (key) {
                    $log.debug("Clearing drag data for " + key);
                    delete data[key];
                }
            };
        }

        return DndService;
    }
);