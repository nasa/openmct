/*global define,Promise*/

/**
 * Module defining ContextualDomainObject. Created by vwoeltje on 11/18/14.
 */
define(
    ["./ContextCapability"],
    function (ContextCapability) {
        "use strict";

        /**
         * Wraps a domain object, such that it exposes a `context` capability.
         * A domain object may be contained by multiple other domain objects;
         * the `context` capability allows two instances of the same domain
         * object to be distinguished from one another based on which
         * specific instance of a containing object exposed them (by way of a
         * `composition` capability.)
         *
         * @param {DomainObject} domainObject the domain object for which
         *        context should be exposed
         * @param {DomainObject} parentObject the domain object from which
         *        the wrapped object was retrieved
         *
         * @constructor
         */
        function ContextualDomainObject(domainObject, parentObject) {
            // Prototypally inherit from the domain object, and
            // instantiate its context capability ahead of time.
            var contextualObject = Object.create(domainObject),
                contextCapability =
                    new ContextCapability(parentObject, domainObject);

            // Intercept requests for a context capability.
            contextualObject.getCapability = function (name) {
                return name === "context" ?
                        contextCapability :
                        domainObject.getCapability.apply(this, arguments);
            };

            return contextualObject;
        }

        return ContextualDomainObject;
    }
);