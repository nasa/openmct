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
/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * An extension's plain JSON definition.
         *
         * @name ExtensionDefinition
         * @property {string} [key] the machine-readable identifier for this
         *           extension
         * @property {string} [implementation] the path to the AMD module
         *           which implements this extension; this path is relative
         *           to the containing bundle's source folder.
         * @property {string[]} [depends=[]] the dependencies needed by this
         *           extension; these are strings as shall be passed to
         *           Angular's dependency resolution mechanism.
         */

        /**
         * Instantiate a new extension based on its definition. This serves
         * primarily as a wrapper around the extension's definition to expose
         * a useful interface.
         *
         * An extension
         *
         * @param {Bundle} bundle the bundle which exposed this extension
         * @param {string} category the type of extension being exposed
         * @param {ExtensionDefinition} definition the plain definition of
         *        this extension
         * @constructor
         */
        function Extension(bundle, category, definition) {
            var logName = category,
                extensionDefinition = {};

            // Build up the log-friendly name for this bundle
            if (definition.key || definition.name) {
                logName += "(";
                logName += definition.key || "";
                logName += (definition.key && definition.name) ? " " : "";
                logName += definition.name || "";
                logName += ")";
            }
            logName += " from " + bundle.getLogName();

            // Copy over definition. This allows us to attach the bundle
            // definition without modifying the original definition object.
            Object.keys(definition).forEach(function (k) {
                extensionDefinition[k] = definition[k];
            });

            // Attach bundle metadata
            extensionDefinition.bundle = bundle.getDefinition();

            return {
                /**
                 * Get the machine-readable identifier for this extension.
                 *
                 * @returns {string}
                 */
                getKey: function () {
                    return definition.key || "undefined";
                },
                /**
                 * Get the bundle which declared this extension.
                 *
                 * @memberof Extension#
                 * @returns {Bundle}
                 */
                getBundle: function () {
                    return bundle;
                },
                /**
                 * Get the category into which this extension falls.
                 * (e.g. "directives")
                 *
                 * @memberof Extension#
                 * @returns {string}
                 */
                getCategory: function () {
                    return category;
                },
                /**
                 * Check whether or not this extension should have an
                 * associated implementation module which may need to
                 * be loaded.
                 *
                 * @returns {boolean} true if an implementation separate
                 *          from this definition should also be loaded
                 */
                hasImplementation: function () {
                    return definition.implementation !== undefined;
                },
                /**
                 * Get the path to the AMD module which implements this
                 * extension. Will return undefined if there is no
                 * implementation associated with this extension.
                 *
                 * @memberof Extension#
                 * @returns {string} path to implementation, or undefined
                 */
                getImplementationPath: function () {
                    return definition.implementation ?
                            bundle.getSourcePath(definition.implementation) :
                            undefined;
                },
                /**
                 * Get a log-friendly name for this extension; this will
                 * include both the key (machine-readable name for this
                 * extension) and the name (human-readable name for this
                 * extension.)
                 * @returns {string} log-friendly name for this extension
                 */
                getLogName: function () {
                    return logName;
                },
                /**
                 * Get the plain definition of the extension.
                 *
                 * Note that this definition will have an additional "bundle"
                 * field which points back to the bundle which defined the
                 * extension, as a convenience.
                 *
                 * @memberof Extension#
                 * @returns {ExtensionDefinition} the plain definition of
                 *          this extension, as read from the bundle
                 *          declaration.
                 */
                getDefinition: function () {
                    return extensionDefinition;
                }

            };
        }

        return Extension;

    }
);