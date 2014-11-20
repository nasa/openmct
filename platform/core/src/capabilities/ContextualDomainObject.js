/*global define,Promise*/

/**
 * Module defining ContextualDomainObject. Created by vwoeltje on 11/18/14.
 */
define(
    ["./ContextCapability"],
    function (ContextCapability) {
        "use strict";

        /**
         *
         * @constructor
         */
        function ContextualDomainObject(domainObject, parentObject) {
            var contextualObject = Object.create(domainObject),
                contextCapability =
                    new ContextCapability(parentObject, domainObject);

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