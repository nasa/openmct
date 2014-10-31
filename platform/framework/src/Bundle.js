/*global define*/

define(
    [],
    function () {
        "use strict";


        /**
         * A bundle's plain JSON definition.
         *
         * @name BundleDefinition
         * @property {string} name the human-readable name of this bundle
         * @property {Object.<string,ExtensionDefinition[]>} [extensions={}]
         *           all extensions exposed by this bundle
         */


        /**
         * Instantiate a new reference to a bundle, based on its human-readable
         * definition.
         *
         * @param {string} path the path to the directory containing
         *        this bundle
         * @param {BundleDefinition} definition
         * @returns {{getDefinition: Function}}
         * @constructor
         */
        function Bundle(path, definition) {


            return {
                /**
                 *
                 * @returns {BundleDefinition} the raw definition of this bundle
                 */
                getDefinition: function () {
                    return definition;
                }
            };
        }

        new Bundle().getDefinition().extensions['k'][0].

        return Bundle;
    }
);