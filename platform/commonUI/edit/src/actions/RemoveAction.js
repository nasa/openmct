/*global define*/

/**
 * Module defining RemoveAction. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Construct an action which will remove the provided object manifestation.
         * The object will be removed from its parent's composition; the parent
         * is looked up via the "context" capability (so this will be the
         * immediate ancestor by which this specific object was reached.)
         *
         * @param {DomainObject} object the object to be removed
         * @param {ActionContext} context the context in which this action is performed
         * @constructor
         * @memberof module:editor/actions/remove-action
         */
        function RemoveAction($q, context) {
            var object = (context || {}).domainObject;

            /**
             * Check whether an object ID matches the ID of the object being
             * removed (used to filter a parent's composition to handle the
             * removal.)
             */
            function isNotObject(otherObjectId) {
                return otherObjectId !== object.getId();
            }

            /**
             * Mutate a parent object such that it no longer contains the object
             * which is being removed.
             */
            function doMutate(model) {
                model.composition = model.composition.filter(isNotObject);
            }

            /**
             * Invoke persistence on a domain object. This will be called upon
             * the removed object's parent (as its composition will have changed.)
             */
            function doPersist(domainObject) {
                var persistence = domainObject.getCapability('persistence');
                return persistence && persistence.persist();
            }

            /**
             * Remove the object from its parent, as identified by its context
             * capability.
             * @param {ContextCapability} contextCapability the "context" capability
             *        of the domain object being removed.
             */
            function removeFromContext(contextCapability) {
                var parent = contextCapability.getParent();
                $q.when(
                    parent.useCapability('mutation', doMutate)
                ).then(function () {
                    return doPersist(parent);
                });
            }

            return {
                /**
                 * Perform this action.
                 * @return {module:core/promises.Promise} a promise which will be
                 *         fulfilled when the action has completed.
                 */
                perform: function () {
                    return $q.when(object.getCapability('context'))
                        .then(removeFromContext);
                }
            };
        }

        // Object needs to have a parent for Remove to be applicable
        RemoveAction.appliesTo = function (context) {
            var object = (context || {}).domainObject,
                contextCapability = object && object.getCapability("context"),
                parent = contextCapability && contextCapability.getParent(),
                parentType = parent.getCapability('type'),
                parentCreatable = parentType && parentType.hasFeature('creation');

            // Only creatable types should be modifiable
            return parent !== undefined &&
                    Array.isArray(parent.getModel().composition) &&
                    parentCreatable;
        };

        return RemoveAction;
    }
);