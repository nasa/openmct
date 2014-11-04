/*global define,Promise*/

/**
 * Module defining BundleResolver. Created by vwoeltje on 11/4/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function BundleResolver(extensionResolver) {

            /**
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

                return Promise.all(categories.map(resolveCategory))
                    .then(giveResult);
            }

            return {
                resolveBundles: function (bundles) {
                    return Promise.all(bundles.map(resolveBundle))
                        .then(mergeResolvedBundles);
                }
            };
        }

        return BundleResolver;
    }
);