/*global define,Promise*/

/**
 * Type capability provider. Provides capabilities for domain objects based
 * on properties defined as part of their type, where type is inferred from
 * a string with key "type" in the model.
 *
 * These capabilities include the "type" capability, which providers
 * information about an object's type not stored in the model.
 *
 * @module core/type/type-capability-provider
 */
define(
    [],
    function () {
        'use strict';
        var promises = {
            merge: Promise.all,
            decorate: function (promise, callback) {
                return promise.then(callback);
            },
            as: function (value) {
                return Promise.resolve(value);
            }
        };

        /**
         * Construct a new type capability provider. The provided type
         * service will be used to obtain type information; the provided
         * module service will be used to load modules which define
         * factories for capabilities associated with types.
         *
         * @param {TypeService} typeService the service which will
         *        provide type information/definitions
         * @param {ModuleService} moduleService the service which
         *        shall allow other JavaScript modules to be loaded.
         * @constructor
         * @memberof module:core/type/type-capability-provider
         */
        function TypeCapabilityProvider(typeService, moduleService) {
            var typeFactories = {};

            function buildTypeFactory(type) {
                var capabilities = type.getDefinition().capabilities || [];

                return promises.decorate(
                    promises.merge(capabilities.map(moduleService.get)),
                    function (modules) {
                        var factory = {};

                        modules.filter(function (mod) {
                            return mod;
                        }).forEach(function (mod) {
                            var capFactories = mod.capabilities || {};
                            Object.keys(capFactories).forEach(function (k) {
                                factory[k] = capFactories[k];
                            });
                        });

                        // And the "type" capability
                        factory.type = function () {
                            return type;
                        };

                        return factory;
                    }
                );
            }

            /**            
             * Description  (TODO)
             * @param {string} typeKey Description
             * @returns {string} Description   TODO
             */
            function promiseTypeFactory(typeKey) {
                return (typeFactories[typeKey] = typeFactories[typeKey] || promises.decorate(
                    typeService.getType(typeKey),
                    buildTypeFactory
                ));
            }

            return {
                /**
                 * Get a capability which should be expressed by a domain
                 * object. This will return a promise for the capability instance;
                 * if the named capaability is not provided for that domain
                 * object by this service, the result of the fulfilled promise
                 * will be undefined.
                 *
                 * @param {module:core/api/domain-object.DomainObject} domainObject the
                 *        domain object which may or may not express this capability
                 * @param {string} name the name of the capability requested
                 * @memberof module:core/type/type-capability-provider.TypeCapabilityProvider#
                 */
                getCapability: function (domainObject, name) {
                    var typeKey = domainObject.getModel().type;
                    return promises.decorate(
                        promiseTypeFactory(typeKey),
                        function (typeFactory) {
                            return typeFactory[name] ?
                                     typeFactory[name](domainObject) :
                                     undefined;
                        }
                    );
                }
            };
        }

        return {
            instantiate: TypeCapabilityProvider
        };
    }
);