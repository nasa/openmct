/*global define,Promise*/

/**
 * Module defining CoreCapabilityProvider. Created by vwoeltje on 11/7/14.
 */
define(
    ['./QueuingPersistenceCapability'],
    function (QueuingPersistenceCapability) {
        "use strict";

        /**
         * Capability decorator. Adds queueing support to persistence
         * capabilities for domain objects, such that persistence attempts
         * will be handled in batches (allowing failure notification to
         * also be presented in batches.)
         *
         * @constructor
         */
        function QueuingPersistenceCapabilityDecorator(
            persistenceQueue,
            capabilityService
        ) {

            function decoratePersistence(capabilities) {
                var originalPersistence = capabilities.persistence;
                if (originalPersistence) {
                    capabilities.persistence = function (domainObject) {
                        // Get/instantiate the original
                        var original =
                            (typeof originalPersistence === 'function') ?
                                    originalPersistence(domainObject) :
                                    originalPersistence;

                        // Provide a decorated version
                        return new QueuingPersistenceCapability(
                            persistenceQueue,
                            original,
                            domainObject
                        );
                    };
                }
                return capabilities;
            }

            function getCapabilities(model) {
                return decoratePersistence(
                    capabilityService.getCapabilities(model)
                );
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

        return QueuingPersistenceCapabilityDecorator;
    }
);