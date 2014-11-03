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
         * @param {ExtensionResolver} resolver
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
             * @param bundles
             * @returns {Object.<string, object[]>} an object mapping
             */
            function resolveExtensions(bundles) {
                var resolvedExtensions = {};


                function resolveExtensionsForBundle(bundle) {

                }

                return Promises.all(bundles.map(resolveExtensionsForBundle)).then(function () {
                    return resolvedExtensions;
                });
            }

            function loadBundles(bundleList) {
                return loader.loadBundles(bundleList);
            }

            return {
                runApplication: function (bundleList) {
                    return loadBundles()
                        .then(resolveExtensions)
                        .then(registerExtensions)
                        .then(bootstrapApplication);
                }

            };
        }

        return FrameworkInitializer;
    }
);