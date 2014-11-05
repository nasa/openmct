/*global define,Promise*/

/**
 * Module defining FrameworkInitializer. Created by vwoeltje on 11/3/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Responsible for managing the four stages of framework
         * initialization:
         *
         * * Loading bundle metadata (JSON files)
         * * Resolving extension implementations with Require
         * * Registering extensions with Angular
         * * Bootstrapping the Angular application.
         *
         * @constructor
         * @param {BundleLoader} loader
         * @param {BundleResolver} resolver
         * @param {ExtensionRegistrar} registrar
         * @param {ApplicationBootstrapper} bootstrapper
         */
        function FrameworkInitializer(loader, resolver, registrar, bootstrapper) {

            return {
                runApplication: function (bundleList) {
                    return loader.loadBundles(bundleList)
                        .then(resolver.resolveBundles)
                        .then(registrar.registerExtensions)
                        .then(bootstrapper.bootstrap);
                }

            };
        }

        return FrameworkInitializer;
    }
);