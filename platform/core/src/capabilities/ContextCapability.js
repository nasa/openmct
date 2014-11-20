/*global define,Promise*/

/**
 * Module defining ContextCapability. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The `context` capability of a domain object (retrievable with
         * `domainObject.getCapability("context")`) allows an object's
         * hierarchical parents and ancestors to be retrieved (specifically,
         * those whose `composition` capability was used to access this
         * object.)
         *
         * @constructor
         */
        function ContextCapability(parentObject, domainObject) {
            return {
                /**
                 * Get the immediate parent of a domain object.
                 *
                 * A domain object may be contained in multiple places; its
                 * parent (as exposed by this capability) is the domain
                 * object from which this object was accessed, usually
                 * by way of a `composition` capability.
                 *
                 * @returns {DomainObject} the immediate parent of this
                 *          domain object.
                 */
                getParent: function () {
                    return parentObject;
                },
                /**
                 * Get an array containing the complete direct ancestry
                 * of this domain object, including the domain object
                 * itself.
                 *
                 * A domain object may be contained in multiple places; its
                 * parent and all ancestors (as exposed by this capability)
                 * serve as a record of how this specific domain object
                 * instance was reached.
                 *
                 * The first element in the returned array is the deepest
                 * ancestor; subsequent elements are progressively more
                 * recent ancestors, with the domain object which exposed
                 * the capability occupying the last element of the array.
                 *
                 * @returns {DomainObject[]} the full composition ancestry
                 *          of the domain object which exposed this
                 *          capability.
                 */
                getPath: function () {
                    var parentPath = [],
                        parentContext;

                    if (parentObject) {
                        parentContext = parentObject.getCapability("context");
                        parentPath = parentContext ?
                                parentContext.getPath() :
                                [parentObject];
                    }

                    return parentPath.concat([domainObject]);
                },
                /**
                 * Get the deepest ancestor available for this domain object;
                 * equivalent to `getPath()[0]`.
                 *
                 * See notes on `getPath()` for how ancestry is defined in
                 * the context of this capability.
                 *
                 * @returns {DomainObject} the deepest ancestor of the domain
                 *          object which exposed this capability.
                 */
                getRoot: function () {
                    return this.getPath()[0];
                }
            };
        }

        return ContextCapability;
    }
);