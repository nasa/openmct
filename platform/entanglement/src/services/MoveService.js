/*global define */

define(
    function () {
        "use strict";

        function MoveService(policyService, linkService) {
            return {
                /**
                 * Returns `true` if `object` can be moved into
                 * `parentCandidate`'s composition.
                 */
                validate: function (object, parentCandidate) {
                    var currentParent = object
                        .getCapability('context')
                        .getParent();

                    if (!parentCandidate || !parentCandidate.getId) {
                        return false;
                    }
                    if (parentCandidate.getId() === currentParent.getId()) {
                        return false;
                    }
                    if (parentCandidate.getId() === object.getId()) {
                        return false;
                    }
                    if (parentCandidate.getModel().composition.indexOf(object.getId()) !== -1) {
                        return false;
                    }
                    return policyService.allow(
                        "composition",
                        object.getCapability('type'),
                        parentCandidate.getCapability('type')
                    );
                },
                /**
                 * Move `object` into `parentObject`'s composition.
                 *
                 * @returns {Promise} A promise that is fulfilled when the
                 *    move operation has completed.
                 */
                perform: function (object, parentObject) {
                    return linkService
                        .perform(object, parentObject)
                        .then(function () {
                            return object
                                .getCapability('action')
                                .perform('remove');
                        });
                }
            };
        }

        return MoveService;
    }
);
