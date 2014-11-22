/*global define,Promise*/

/**
 * Module defining CoreCapabilityProvider. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Provides capabilities based on extension definitions,
         * matched to domain object models.
         *
         * @param {Array.<function(DomainObject) : Capability>} an array
         *        of constructor functions for capabilities, as
         *        exposed by extensions defined at the bundle level.
         *
         * @constructor
         */
        function CoreCapabilityProvider(capabilities, $log) {
            // Filter by invoking the capability's appliesTo method
            function filterCapabilities(model) {
                return capabilities.filter(function (capability) {
                    return capability.appliesTo ?
                            capability.appliesTo(model) :
                            true;
                });
            }

            // Package capabilities as key-value pairs
            function packageCapabilities(capabilities) {
                var result = {};
                capabilities.forEach(function (capability) {
                    if (capability.key) {
                        result[capability.key] = capability;
                    } else {
                        $log.warn("No key defined for capability; skipping.");
                    }
                });
                return result;
            }

            function getCapabilities(model) {
                return packageCapabilities(filterCapabilities(model));
            }

            return {
                /**
                 * Get all capabilities associated with a given domain
                 * object.
                 *
                 * This returns a promise for an object containing key-value
                 * pairs, where keys are capability names and values are
                 * either:
                 *
                 * * Capability instances
                 * * Capability constructors (which take a domain object
                 *   as their argument.)
                 *
                 *
                 * @param {*} model the object model
                 * @returns {Object.<string,function|Capability>} all
                 *     capabilities known to be valid for this model, as
                 *     key-value pairs
                 */
                getCapabilities: getCapabilities
            };
        }

        return CoreCapabilityProvider;
    }
);