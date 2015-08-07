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
 * Module defining DomainObject. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Construct a new domain object with the specified
         * identifier, model, and capabilities.
         *
         * @param {string} id the object's unique identifier
         * @param {object} model the "JSONifiable" state of the object
         * @param {Object.<string, Capability>|function} capabilities all
         *        capabilities to be exposed by this object
         * @memberof platform/core
         * @constructor
         */
        function DomainObject(id, model, capabilities) {
            return {
                /**
                 * Get the unique identifier for this domain object.
                 * @return {string} the domain object's unique identifier
                 * @memberof DomainObject#
                 * @memberof platform/core.DomainObject#
                 */
                getId: function () {
                    return id;
                },

                /**
                 * Get the domain object's model. This is useful to
                 * directly look up known properties of an object, but
                 * direct modification of a returned model is generally
                 * discouraged and may result in errors. Instead, an
                 * object's "mutation" capability should be used.
                 *
                 * @return {object} the domain object's persistent state
                 * @memberof DomainObject#
                 * @memberof platform/core.DomainObject#
                 */
                getModel: function () {
                    return model;
                },

                /**
                 * Get a capability associated with this object.
                 * Capabilities are looked up by string identifiers;
                 * prior knowledge of a capability's interface is
                 * necessary.
                 *
                 * @return {Capability} the named capability, or undefined
                 *         if not present.
                 * @memberof DomainObject#
                 * @memberof platform/core.DomainObject#
                 */
                getCapability: function (name) {
                    var capability = capabilities[name];
                    return typeof capability === 'function' ?
                            capability(this) : capability;
                },

                /**g
                 * Check if this domain object supports a capability
                 * with the provided name.
                 *
                 * @param {string} name the name of the capability to
                 *        check for
                 * @returns {boolean} true if provided
                 * @memberof platform/core.DomainObject#
                 */
                hasCapability: function hasCapability(name) {
                    return this.getCapability(name) !== undefined;
                },

                /**
                 * Use a capability of an object; this is a shorthand
                 * for:
                 *
                 * ```
                 *   hasCapability(name) ?
                 *       getCapability(name).invoke(args...) :
                 *       undefined
                 * ```
                 *
                 * That is, it handles both the check-for-existence and
                 * invocation of the capability, and checks for existence
                 * before invoking the capability.
                 *
                 * @param {string} name the name of the capability to invoke
                 * @param {...*} [arguments] to pass to the invocation
                 * @returns {*}
                 * @memberof DomainObject#
                 * @memberof platform/core.DomainObject#
                 */
                useCapability: function (name) {
                    // Get tail of args to pass to invoke
                    var args = Array.prototype.slice.apply(arguments, [1]),
                        capability = this.getCapability(name);

                    return (capability && capability.invoke) ?
                            capability.invoke.apply(capability, args) :
                            capability;
                }
            };
        }

        return DomainObject;
    }
);
