/*global define,Promise*/

/**
 * Module defining BundleLoader.js. Created by vwoeltje on 10/31/14.
 */
define(
    ['./Constants', './Bundle'],
    function (Constants, Bundle) {
        "use strict";

        var INVALID_ARGUMENT_MESSAGE = "Malformed loadBundles argument; " +
            "expected string or array",
            BAD_CONTENTS_PREFIX = "Invalid bundle contents for ",
            LOAD_ERROR_PREFIX = "Failed to load bundle ";

        /**
         *
         * @constructor
         * @param {object} $http Angular's HTTP requester
         * @param {object} $log Angular's logging service
         */
        function BundleLoader($http, $log) {

            // Utility function; load contents of JSON file using $http
            function getJSON(file) {
                return $http.get(file).then(function (response) {
                    return response.data;
                });
            }

            // Remove bundles which failed to load properly.
            // These should have been logged when loaded by
            // loadBundleDefinition, so at this point they are safe
            // to discard.
            function filterBundles(array) {
                return array.filter(function (x) { return x !== undefined; });
            }

            // Load a definition for a bundle
            function loadBundleDefinition(bundlePath) {
                return getJSON(bundlePath + "/" + Constants.BUNDLE_FILE).then(
                    function (x) {
                        if (x === null || typeof x !== 'object') {
                            $log.warn(BAD_CONTENTS_PREFIX + bundlePath);
                            return undefined;
                        }
                        return x;
                    },
                    function () {
                        $log.warn(LOAD_ERROR_PREFIX + bundlePath);
                        return undefined;
                    }
                );
            }

            function loadBundle(bundlePath) {
                return loadBundleDefinition(bundlePath).then(function (definition) {
                    return definition && (new Bundle(bundlePath, definition));
                });
            }

            function loadBundlesFromArray(bundleArray) {
                var bundlePromises = bundleArray.map(loadBundle);

                return Promise.all(bundlePromises)
                        .then(filterBundles);
            }

            function loadBundlesFromFile(listFile) {
                return getJSON(listFile).then(loadBundlesFromArray);
            }

            function loadBundles(bundles) {
                return Array.isArray(bundles) ? loadBundlesFromArray(bundles) :
                        (typeof bundles === 'string') ? loadBundlesFromFile(bundles) :
                                Promise.reject(new Error(INVALID_ARGUMENT_MESSAGE));
            }


            return {
                loadBundles: loadBundles
            };
        }

        return BundleLoader;
    }
);