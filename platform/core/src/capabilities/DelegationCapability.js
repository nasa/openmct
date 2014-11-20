/*global define,Promise*/

/**
 * Module defining DelegationCapability. Created by vwoeltje on 11/18/14.
 */
define(
    [],
    function () {
        'use strict';

        function DelegationCapability(domainObject) {
            var delegateCapabilities = {},
                type = domainObject.getCapability("type");

            function filterObjectsWithCapability(capability) {
                return function (objects) {
                    return objects.filter(function (obj) {
                        return obj.hasCapability(capability);
                    });
                };
            }

            function promiseChildren() {
                return domainObject.useCapability('composition');
            }

            function doesDelegate(key) {
                return delegateCapabilities[key] || false;
            }

            function getDelegates(capability) {
                return doesDelegate(capability) ?
                        promiseChildren().then(
                            filterObjectsWithCapability(capability)
                        ) :
                        [];
            }

            // Generate set for easy lookup of capability delegation
            if (type && type.getDefinition) {
                (type.getDefinition().delegates || []).forEach(function (key) {
                    delegateCapabilities[key] = true;
                });
            }

            return {
                invoke: getDelegates,
                getDelegates: getDelegates,
                doesDelegateCapability: doesDelegate
            };
        }


        return DelegationCapability;

    }
);