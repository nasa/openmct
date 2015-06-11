/*global define */

define(
    function () {
        "use strict";

        function LinkService(policyService) {
            return {
                /**
                 * Returns `true` if `object` can be linked into
                 * `parentCandidate`'s composition.
                 */
                validate: function (object, parentCandidate) {
                    if (!parentCandidate || !parentCandidate.getId) {
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
                 * Link `object` into `parentObject`'s composition.
                 *
                 * @returns {Promise} A promise that is fulfilled when the
                 *    linking operation has completed.
                 */
                perform: function (object, parentObject) {
                    return parentObject.useCapability('mutation', function (model) {
                        if (model.composition.indexOf(object.getId()) === -1) {
                            model.composition.push(object.getId());
                        }
                    }).then(function () {
                        return parentObject.getCapability('persistence').persist();
                    });
                }
            };
        }

        return LinkService;
    }
);
