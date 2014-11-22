/*global define*/

/**
 * Module defining DelegationCapability. Created by vwoeltje on 11/18/14.
 */
define(
    [],
    function () {
        'use strict';


        /**
         * The `delegation` capability allows a domain object to indicate
         * that it wishes to delegate responsibility for some other
         * capability to some other domain objects.
         *
         * This is specifically useful in the case of telemetry panels,
         * which delegate responsibility for the `telemetry` capability
         * to their contained objects.
         *
         * A type of domain object may indicate that it wishes to delegate
         * responsibility for one or more capabilities to the members of
         * its composition; this is done by included a `delegates` field
         * in the type's definition, which contains an array of names of
         * capabilities to be delegated.
         *
         * @param domainObject
         * @constructor
         */
        function DelegationCapability($q, domainObject) {
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
                        $q.when([]);
            }

            // Generate set for easy lookup of capability delegation
            if (type && type.getDefinition) {
                (type.getDefinition().delegates || []).forEach(function (key) {
                    delegateCapabilities[key] = true;
                });
            }

            return {
                /**
                 * Invoke this capability; alias of `getDelegates`, used to
                 * simplify usage, e.g.:
                 *
                 * `domainObject.useCapability("delegation", "telemetry")`
                 *
                 * ...will retrieve all members of a domain object's
                 * composition which have a "telemetry" capability.
                 *
                 * @param {string} the name of the delegated capability
                 * @returns {DomainObject[]} the domain objects to which
                 *          responsibility for this capability is delegated.
                 */
                invoke: getDelegates,
                /**
                 * Get the domain objects which are intended to be delegated
                 * responsibility for some specific capability.
                 *
                 * @param {string} the name of the delegated capability
                 * @returns {DomainObject[]} the domain objects to which
                 *          responsibility for this capability is delegated.
                 */
                getDelegates: getDelegates,
                doesDelegateCapability: doesDelegate
            };
        }


        return DelegationCapability;

    }
);