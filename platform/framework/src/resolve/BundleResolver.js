/*global define,Promise*/

/**
 * Module defining BundleResolver. Created by vwoeltje on 11/4/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Responsible for the extension resolution phase of framework
         * initialization. During this phase, any scripts implementing
         * extensions provided by bundles are loaded.
         *
         * @constructor
         */
        function BundleResolver(extensionResolver, $log) {

            /**
             * Merge resolved bundles (where each is expressed as an
             * object containing key-value pairs, where keys are extension
             * categories and values are arrays of resolved extensions)
             * into one large object containing resolved extensions from
             * all bundles (in the same form.)
             *
             * @param {Object.<string, object[]>[]} resolvedBundles
             * @returns {Object.<string, object[]>}
             */
            function mergeResolvedBundles(resolvedBundles) {
                var result = {};

                resolvedBundles.forEach(function (resolved) {
                    Object.keys(resolved).forEach(function (k) {
                        result[k] = (result[k] || []).concat(resolved[k]);
                    });
                });

                return result;
            }

            // Resolve a bundle; resolve all extensions, and return
            // the resolved extensions in an object in the format described
            // for mergeResolvedBundles above
            function resolveBundle(bundle) {
                var categories = bundle.getExtensionCategories(),
                    result = {};

                function resolveExtension(extension) {
                    var category = extension.getCategory();

                    function push(resolved) {
                        result[category].push(resolved);
                    }

                    return extensionResolver.resolve(extension).then(push);
                }

                function resolveCategory(category) {
                    result[category] = [];
                    return Promise.all(
                        bundle.getExtensions(category).map(resolveExtension)
                    );
                }

                function giveResult() {
                    return result;
                }

                // Log the large-scale task
                $log.info(
                    "Resolving extensions for bundle " + bundle.getLogName()
                );

                return Promise.all(categories.map(resolveCategory))
                    .then(giveResult);
            }

            return {
                /**
                 * Resolve all extensions exposed by these bundles.
                 *
                 * @param {Bundle[]} bundles the bundles to resolve
                 * @returns {Object.<string, object[]>} an object containing
                 *          key-value pairs, where keys are extension
                 *          categories and values are arrays of resolved
                 *          extensions belonging to those categories
                 */
                resolveBundles: function (bundles) {
                    return Promise.all(bundles.map(resolveBundle))
                        .then(mergeResolvedBundles);
                }
            };
        }

        return BundleResolver;
    }
);