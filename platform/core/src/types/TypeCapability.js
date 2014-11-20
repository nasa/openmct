/*global define,Promise*/

/**
 * Module defining TypeCapability. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The `type` capability makes information about a domain object's
         * type directly available when working with that object, by way
         * of a `domainObject.getCapability('type')` invocation.
         *
         * @constructor
         * @param {TypeService} typeService the service which
         *        provides type information
         * @param {DomainObject} domainObject the domain object
         *        which exposes the type capability
         */
        function TypeCapability(typeService, domainObject) {
            var typeKey = domainObject.getModel().type,
                type = typeService.getType(typeKey);

            // Simply return the type, but wrap with Object.create
            // to avoid exposing the type object directly.
            return Object.create(type);
        }

        return TypeCapability;
    }
);