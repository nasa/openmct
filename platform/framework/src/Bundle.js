/*global define*/

define(
    ['./Constants', './Extension'],
    function (Constants, Extension) {
        "use strict";


        /**
         * A bundle's plain JSON definition.
         *
         * @name BundleDefinition
         * @property {string} name the human-readable name of this bundle
         * @property {string} sources the name of the directory which
         *           contains source code used by this bundle
         * @property {string} resources the name of the directory which
         *           contains resource files used by this bundle
         * @property {Object.<string,ExtensionDefinition[]>} [extensions={}]
         *           all extensions exposed by this bundle
         */


        /**
         * Instantiate a new reference to a bundle, based on its human-readable
         * definition.
         *
         * @param {string} path the path to the directory containing
         *        this bundle
         * @param {BundleDefinition} bundleDefinition
         * @returns {{getDefinition: Function}}
         * @constructor
         */
        function Bundle(path, bundleDefinition) {
            // Start with defaults
            var definition = Object.create(Constants.DEFAULT_BUNDLE),
                logName = path,
                self;

            // Utility function for resolving paths in this bundle
            function resolvePath(elements) {
                return path.concat(elements || []).join(Constants.SEPARATOR);
            }

            // Override defaults with specifics from bundle definition
            Object.keys(bundleDefinition).forEach(function (k) {
                definition[k] = bundleDefinition[k];
            });

            // Build up the log-friendly name for this bundle
            if (definition.key || definition.name) {
                logName += "(";
                logName += definition.key || "";
                logName += (definition.key && definition.name) ? " " : "";
                logName += definition.name || "";
                logName += ")";
            }

            return (self = {
                /**
                 *
                 * @memberof Bundle#
                 * @returns {string}
                 */
                getPath: function () {
                    return path;
                },
                /**
                 * Get the path to this bundle's source folder. If an
                 * argument is provided, the path will be to the source
                 * file within the bundle's source file.
                 *
                 * @memberof Bundle#
                 * @param {string} [sourceFile] optionally, give a path to
                 *        a specific source file in the bundle.
                 * @returns {string}
                 */
                getSourcePath: function (sourceFile) {
                    var subpath = sourceFile ?
                            [ definition.sources, sourceFile ] :
                            [ definition.sources ];

                    return resolvePath(subpath);
                },
                /**
                 * Get the path to this bundle's resource folder. If an
                 * argument is provided, the path will be to the resource
                 * file within the bundle's resource file.
                 *
                 * @memberof Bundle#
                 * @param {string} [resourceFile] optionally, give a path to
                 *        a specific resource file in the bundle.
                 * @returns {string}
                 */
                getResourcePath: function (resourceFile) {
                    var subpath = resourceFile ?
                            [ definition.resources, resourceFile ] :
                            [ definition.resources ];

                    return resolvePath(subpath);
                },
                /**
                 * Get a log-friendly name for this bundle; this will
                 * include both the key (machine-readable name for this
                 * bundle) and the name (human-readable name for this
                 * bundle.)
                 * @returns {string} log-friendly name for this bundle
                 */
                getLogName: function () {
                    return logName;
                },
                getExtensions: function (category) {
                    var extensions = definition.extensions[category] || [];

                    return extensions.map(function objectify(extDefinition) {
                        return new Extension(self, category, extDefinition);
                    });
                },
                getExtensionCategories: function () {
                    return Object.keys(definition.extensions);
                },
                /**
                 *
                 * @memberof Bundle#
                 * @returns {BundleDefinition} the raw definition of this bundle
                 */
                getDefinition: function () {
                    return definition;
                }
            });
        }

        return Bundle;
    }
);