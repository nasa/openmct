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
         * @param {Object.<string, Capability|function} capabilities all
         *        capabilities to be exposed by this object
         * @constructor
         */
        function DomainObject(id, model, capabilities) {
            return {
                /**
                 * Get the unique identifier for this domain object.
                 * @return {string} the domain object's unique identifier
                 * @memberof DomainObject#
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