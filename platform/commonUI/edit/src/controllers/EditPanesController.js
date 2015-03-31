/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Supports the Library and Elements panes in Edit mode.
         * @constructor
         */
        function EditPanesController($scope) {
            var root;

            // Update root object based on represented object
            function updateRoot(domainObject) {
                var context = domainObject &&
                    domainObject.getCapability('context'),
                    newRoot = context && context.getTrueRoot(),
                    oldId = root && root.getId(),
                    newId = newRoot && newRoot.getId();

                // Only update if this has actually changed,
                // to avoid excessive refreshing.
                if (oldId !== newId) {
                    root = newRoot;
                }
            }

            // Update root when represented object changes
            $scope.$watch('domainObject', updateRoot);

            return {
                /**
                 * Get the root-level domain object, as reported by the
                 * represented domain object.
                 * @returns {DomainObject} the root object
                 */
                getRoot: function () {
                    return root;
                }
            };
        }

        return EditPanesController;
    }
);