/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * A PlotAxis provides a template-ready set of options
         * for the domain or range axis, sufficient to populate
         * selectors.
         *
         * @constructor
         * @param {string} axisType the field in metadatas to
         *        look at for axis options; usually one of
         *        "domains" or "ranges"
         * @param {object[]} metadatas metadata objects, as
         *        returned by the `getMetadata()` method of
         *        a `telemetry` capability.
         * @param {object} defaultValue the value to use for the
         *        active state in the event that no options are
         *        found; should contain "name" and "key" at
         *        minimum.
         *
         */
        function PlotAxis(axisType, metadatas, defaultValue) {
            var keys = {},
                options = [];

            // Look through all metadata objects and assemble a list
            // of all possible domain or range options
            function buildOptionsForMetadata(m) {
                (m[axisType] || []).forEach(function (option) {
                    if (!keys[option.key]) {
                        keys[option.key] = true;
                        options.push(option);
                    }
                });
            }

            (metadatas || []).forEach(buildOptionsForMetadata);

            // Plot axis will be used directly from the Angular
            // template, so expose properties directly to facilitate
            // two-way data binding (for drop-down menus)
            return {
                /**
                 * The set of options applicable for this axis;
                 * an array of objects, where each object contains a
                 * "key" field and a "name" field (for machine- and
                 * human-readable names respectively)
                 */
                options: options,
                /**
                 * The currently chosen option for this axis. An
                 * initial value is provided; this will be updated
                 * directly form the plot template.
                 */
                active: options[0] || defaultValue
            };
        }

        return PlotAxis;

    }
);