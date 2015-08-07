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
         * @memberof platform/core
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
                 * @memberof platform/core.DelegationCapability#
                 */
                invoke: getDelegates,
                /**
                 * Get the domain objects which are intended to be delegated
                 * responsibility for some specific capability.
                 *
                 * @param {string} the name of the delegated capability
                 * @returns {DomainObject[]} the domain objects to which
                 *          responsibility for this capability is delegated.
                 * @memberof platform/core.DelegationCapability#
                 */
                getDelegates: getDelegates,
                doesDelegateCapability: doesDelegate
            };
        }


        return DelegationCapability;

    }
);
