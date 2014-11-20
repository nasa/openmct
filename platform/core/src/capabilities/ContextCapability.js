/*global define,Promise*/

/**
 * Module defining ContextCapability. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function ContextCapability(parentObject, domainObject) {
            var self,
                parentObject;

            self = {
                getParent: function () {
                    return parentObject;
                },
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
                getRoot: function () {
                    return self.getPath()[0];
                }
            };

            return self;
        }

        ContextCapability.appliesTo = function () {
            return true;
        };

        return ContextCapability;
    }
);