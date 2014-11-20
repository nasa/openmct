/*global define,Promise*/

/**
 * Module defining TypeCapability. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function TypeCapability(typeService, domainObject) {
            var typeKey = domainObject.getModel().type,
                type = typeService.getType(typeKey),
                self = Object.create(type);

            self.invoke = function () { return self; };

            return self;
        }

        return TypeCapability;
    }
);