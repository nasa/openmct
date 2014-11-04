/*global define,Promise*/

/**
 * Module defining FrameworkInitializer. Created by vwoeltje on 11/3/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         * @param {BundleLoader} loader
         * @param {BundleResolver} resolver
         * @param {ExtensionRegistrar} registrar
         * @param {ApplicationBootstrapper} bootstrapper
         */
        function FrameworkInitializer(loader, resolver, registrar, bootstrapper) {

            function registerExtensions(resolvedExtensions) {
                Object.keys(resolvedExtensions).forEach(function (category) {
                    registrar.registerExtensions(
                        category,
                        resolvedExtensions[category]
                    );
                });
            }

            /**
             *
             * @param {Bundle[]} bundles
             * @returns {Object.<string, object[]>} an object mapping
             */
            function resolveExtensions(bundles) {
                return resolver.resolveBundles(bundles);
            }

            function loadBundles(bundleList) {
                return loader.loadBundles(bundleList);
            }

            return {
                runApplication: function (bundleList) {
                    return loader.loadBundles(bundleList)
                        .then(resolver.resolveBundles)
                        .then(registrar.registerExtensions)
                        .then(bootstrapper.bootstrapApplication);

                }

            };
        }

        return FrameworkInitializer;
    }
);