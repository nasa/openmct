/*global define */

define(
    function () {
        "use strict";

        function CopyService($q, creationService, policyService) {

            /**
             * duplicateObject duplicates a `domainObject` into the composition
             * of `parent`, and then duplicates the composition of
             * `domainObject` into the new object.
             *
             * This function is a recursive deep copy.
             *
             * @param {DomainObject} domainObject - the domain object to
             *    duplicate.
             * @param {DomainObject} parent - the parent domain object to
             *    create the duplicate in.
             * @returns {Promise} A promise that is fulfilled when the
             *    duplicate operation has completed.
             */
            function duplicateObject(domainObject, parent) {
                var model = JSON.parse(JSON.stringify(domainObject.getModel()));
                if (domainObject.hasCapability('composition')) {
                    model.composition = [];
                }

                return creationService
                    .createObject(model, parent)
                    .then(function (newObject) {
                        if (!domainObject.hasCapability('composition')) {
                            return;
                        }

                        return domainObject
                            .useCapability('composition')
                            .then(function (composees) {
                                // Duplicate composition serially to prevent
                                // write conflicts.
                                return composees.reduce(function (promise, composee) {
                                    return promise.then(function () {
                                        return duplicateObject(composee, newObject);
                                    });
                                }, $q.when(undefined));
                            });
                    });
            }

            return {
                /**
                 * Returns true if `object` can be copied into
                 * `parentCandidate`'s composition.
                 */
                validate: function (object, parentCandidate) {
                    if (!parentCandidate || !parentCandidate.getId) {
                        return false;
                    }
                    if (parentCandidate.getId() === object.getId()) {
                        return false;
                    }
                    return policyService.allow(
                        "composition",
                        object.getCapability('type'),
                        parentCandidate.getCapability('type')
                    );
                },
                /**
                * Wrapper, @see {@link duplicateObject} for implementation.
                */
                perform: function (object, parentObject) {
                    return duplicateObject(object, parentObject);
                }
            };
        }

        return CopyService;
    }
);
