/*global define*/

define(
    [],
    function () {
        "use strict";


        /**
         * Add one domain object to another's composition.
         */
        function LinkAction(context) {
            var domainObject = (context || {}).domainObject,
                selectedObject = (context || {}).selectedObject,
                selectedId = selectedObject && selectedObject.getId();

            // Add this domain object's identifier
            function addId(model) {
                if (Array.isArray(model.composition) &&
                        model.composition.indexOf(selectedId) < 0) {
                    model.composition.push(selectedId);
                }
            }

            // Persist changes to the domain object
            function doPersist() {
                var persistence = domainObject.getCapability('persistence');
                return persistence.persist();
            }

            // Link these objects
            function doLink() {
                return domainObject.useCapability("mutation", addId)
                    .then(doPersist);
            }

            return {
                /**
                 * Perform this action.
                 */
                perform: function () {
                    return selectedId && doLink();
                }
            };
        }

        return LinkAction;
    }
);