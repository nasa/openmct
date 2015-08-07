/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,Promise*/

/**
 * This bundle decorates the persistence service to handle persistence
 * in batches, and to provide notification of persistence errors in batches
 * as well.
 * @namespace platform/persistence/queue
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
         * @memberof platform/persistence/queue
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
                 * @memberof platform/persistence/queue.QueuingPersistenceCapabilityDecorator#
                 */
                getCapabilities: getCapabilities
            };
        }

        return QueuingPersistenceCapabilityDecorator;
    }
);
